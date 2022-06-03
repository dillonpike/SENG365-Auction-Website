import React from 'react';
import { useParams } from "react-router";
import {Box, Card, CardContent, CardMedia, Grid, Modal, Stack, Typography} from "@mui/material";
import UserListObject from "./UserListObject";
import CSS from "csstype";
import axios from "axios";
import BidderListObject from "./BidderListObject";
import AuctionListObject from "./AuctionListObject";
import NavigationBar from "./NavigationBar";
import {deleteAuction, isLoggedIn} from "../api/api";
import Button from "@mui/material/Button";
import {useNavigate} from "react-router-dom";

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4
};

interface ISnackProps {
    handleSnackSuccess: Function,
    handleSnackError: Function
}

const AuctionPage = (props: ISnackProps) => {

    const defaultAuction : Auction = {
        auctionId: 0,
        title: "Default",
        categoryId: 1,
        sellerId: 1,
        sellerFirstName: "",
        sellerLastName: "",
        reserve: 1,
        numBids: 0,
        highestBid: 0,
        endDate: "",
        description: ""
    }
    const { id } = useParams();
    const [auction, setAuction] = React.useState<Auction>(defaultAuction);
    const [similarAuctions, setSimilarAuctions] = React.useState<Array<Auction>>([]);
    const [allCategories, setAllCategories] = React.useState<Array<Category>>([]);
    const [category, setCategory] = React.useState("")
    const [bids, setBids] = React.useState<Array<Bid>>([])
    const [allowEdit, setAllowEdit] = React.useState(false)
    const navigate = useNavigate();

    const getCategory = () => {
        axios.get('http://localhost:4941/api/v1/auctions/categories')
            .then((response) => {
                setAllCategories(response.data)
                for (const category of response.data) {
                    if (category.categoryId === auction.categoryId) {
                        setCategory(category.name)
                        break
                    }
                }
            })
    }

    const getBids = () => {
        axios.get(`http://localhost:4941/api/v1/auctions/${id}/bids`)
            .then((response) => {
                setBids(response.data)
                // setErrorFlag(false)
                // setErrorMessage("")
            }, (error) => {
                // setErrorFlag(true)
                // setErrorMessage(error.toString())
            })
    }

    const getAuction = () => {
        axios.get(`http://localhost:4941/api/v1/auctions/${id}`)
            .then((response) => {
                setAuction(response.data)
                // setErrorFlag(false)
                // setErrorMessage("")
            }, (error) => {
                // setErrorFlag(true)
                // setErrorMessage(error.toString())
            })
    }

    const getSimilarAuctions = () => {
        axios.get('http://localhost:4941/api/v1/auctions',
            {params: {categoryIds: [auction.categoryId]}})
            .then((response) => {
                const sameCategoryAuctions = response.data.auctions.filter((similarAuction: Auction) => auction.auctionId !== similarAuction.auctionId)
                const sameCategoryIds = sameCategoryAuctions.map((similarAuction: Auction) => similarAuction.auctionId)
                axios.get('http://localhost:4941/api/v1/auctions',
                    {params: {sellerId: auction.sellerId}})
                    .then((sellerResponse) => {
                        const sameSellerAuctions = sellerResponse.data.auctions.filter((similarAuction: Auction) =>
                            auction.auctionId !== similarAuction.auctionId && !sameCategoryIds.includes(similarAuction.auctionId))
                        console.log(sameCategoryAuctions)
                        console.log(sameCategoryIds)
                        setSimilarAuctions(sameCategoryAuctions.concat(sameSellerAuctions))
                    })
            })
    }

    React.useEffect(() => {
        getAuction()
        getBids()
    }, [setAuction, id])


    React.useEffect(() => {
        getCategory()
        getSimilarAuctions()
        if (auction.numBids === 0) {
            isLoggedIn(auction.sellerId)
                .then((result: boolean) => {
                    if (result) {
                        setAllowEdit(true)
                    }
                })
        }
    }, [auction])

    const getEndDateString = () => {
        const endDate = new Date(auction.endDate)
        return `${endDate.toLocaleDateString('en-UK',
            {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} 
            ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
            .replaceAll(',', '');
    }

    const bidder_list = () => {
        if (bids.length > 0) {
            return bids.map((bid: Bid) => <BidderListObject key={bid.timestamp} bid={bid}/>)
        } else {
            return <Typography variant="subtitle1">No bids</Typography>
        }
    }

    const similar_auctions_list = () => {
        if (similarAuctions.length > 0) {
            return similarAuctions.map((similarAuction: Auction) =>
                <AuctionListObject key={similarAuction.auctionId} auction={similarAuction} categories={allCategories}/>)
        } else {
            return <Typography variant="subtitle1">No similar auctions</Typography>
        }
    }

    const edit_button = () => {
        return allowEdit ? <Button href={`/edit-auction/${id}`} variant="contained" >Edit Auction</Button> : null
    }

    const delete_button = () => {
        return allowEdit ? <Button color="error" variant="contained" onClick={handleOpen} >Delete Auction</Button> : null
    }

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const delete_modal = () => {
        return (
            <Modal
                open={open}
                onClose={handleClose}
            >
                <Box sx={style}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6" component="h2">
                                Are you sure you want to delete this auction?
                            </Typography>
                        </Grid>
                        <Grid item xs={12} style={{justifyContent: 'center'}}>
                            <Button color="error" variant="contained" onClick={handleDelete}>Confirm</Button>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>
        )
    }

    const handleDelete = () => {
        deleteAuction(auction.auctionId).then((response) => {
            navigate("/")
            props.handleSnackSuccess(`Deleted ${auction.title} auction`)
        }, (error) => {
            props.handleSnackError("Failed to delete auction")
        })
    }

    const auctionCardStyles: CSS.Properties = {
        display: "inline-block",
        margin: "10px",
        padding: "0px",
    }

    return (
        <div>
            <NavigationBar/>
            <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Card sx={auctionCardStyles}>
                            <CardMedia
                                component="img"
                                height="500"
                                width="500"
                                sx={{objectFit:"contain"}}
                                image={`http://localhost:4941/api/v1/auctions/${auction.auctionId}/image`}
                                onError={(event: any) => {event.target.src = `https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg`}}
                                alt="Auction hero"
                            />
                        </Card>
                        <Typography variant="h5" component="div">Similar Auctions</Typography>
                        {similar_auctions_list()}
                    </Grid>
                    <Grid item xs={6}>
                        <Grid container spacing={1}>
                            <Grid item xs={12}>
                                <Card sx={auctionCardStyles}>
                                    <CardContent>
                                        <Typography variant="h5" component="div">{auction.title}</Typography>
                                        <Typography variant="subtitle1" component="div">Closes on: {getEndDateString()}</Typography>
                                        <Typography variant="subtitle1">Category: {category}</Typography>
                                        <Typography variant="subtitle1">Description: {auction.description}</Typography>
                                        <Typography variant="subtitle1">Reserve: {auction.reserve}</Typography>
                                        <Typography variant="subtitle1">Number of bids: {auction.numBids}</Typography>
                                        <UserListObject key={auction.sellerId} userId={auction.sellerId}/>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12}>
                                {edit_button()}
                            </Grid>
                            <Grid item xs={12}>
                                {delete_button()}
                                {delete_modal()}
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="h5" component="div">Bidders</Typography>
                                {bidder_list()}
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </div>
    )
}
export default AuctionPage;