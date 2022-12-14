import React from 'react';
import NavigationBar from "../components/NavigationBar";
import {
    Alert, AlertColor,
    Box, Card, CardMedia,
    FilledInput, FormHelperText,
    Grid,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Select,
    Snackbar,
    TextField
} from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import {Visibility, VisibilityOff} from "@mui/icons-material";
import FormControl from "@mui/material/FormControl";
import {
    register,
    login,
    getUser,
    isLoggedIn,
    getAuction,
    getAuctionImage,
    editAuction,
    editAuctionImage
} from "../api/api"
import {useNavigate} from "react-router-dom";
import {useUserStore} from "../store";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
import AuctionListObject from "../components/AuctionListObject";
import MenuItem from "@mui/material/MenuItem";
import {SelectChangeEvent} from "@mui/material/Select";
import Cookies from "js-cookie";
import {add} from "date-fns";
import CSS from "csstype";
import {useParams} from "react-router";

interface State {
    title: string,
    categoryId: string,
    endDate: string,
    image: any,
    description: string,
    reserve: number,
    error: string,
}

interface ISnackProps {
    handleSnackSuccess: Function,
    handleSnackError: Function
}

const CreateAuctionPage = (props: ISnackProps) => {

    const { id } = useParams();
    const initialDate = add(new Date(),{days: 7});
    const [allCategories, setAllCategories] = React.useState<Array<Category>>([]);
    const [endDate, setEndDate] = React.useState<Date | null>(initialDate);
    const [imageUrl, setImageUrl] = React.useState<string>('');
    const [values, setValues] = React.useState<State>({
        title: '',
        categoryId: '1',
        endDate: initialDate.toISOString().replace('Z', '').replace('T', ' '),
        image: null,
        description: '',
        reserve: 1,
        error: ''
    });
    const [titleError, setTitleError] = React.useState("")
    const [endDateError, setEndDateError] = React.useState("")
    const [descriptionError, setDescriptionError] = React.useState("")
    const [imageError, setImageError] = React.useState("")
    const [reserveError, setReserveError] = React.useState("")

    const navigate = useNavigate();
    const user = useUserStore(state => state.user)
    const setUser = useUserStore(state => state.setUser)

    React.useEffect(() => {
        if (id === undefined) {
            checkRedirectToHome(user.userId)
            setValues({ ...values, title: "", description: "",
                reserve: 1, categoryId: '1',
                endDate: initialDate.toISOString().replace('Z', '').replace('T', ' '),
                image: null })
            setImageUrl('')
        } else {
            getAuction(id)
                .then((response) => {
                    if (response.data.sellerId !== user.userId || response.data.numBids > 0) {
                        navigate("/")
                        props.handleSnackError("You cannot edit someone else's auction")
                    }
                    getAuctionImage(id).then((imageResponse) => {
                        setValues({ ...values, title: response.data.title, description: response.data.description,
                            reserve: response.data.reserve, categoryId: response.data.categoryId,
                            endDate: response.data.endDate.replace('Z', '').replace('T', ' '),
                            image: imageResponse.data })
                        setEndDate(new Date(response.data.endDate))
                        setImageUrl(`http://localhost:4941/api/v1/auctions/${id}/image`)
                    }, (error) => {
                        props.handleSnackError("Failed to load details")
                    })
                }, (error) => {
                    navigate("/")
                    props.handleSnackError("Auction doesn't exist")
                })
        }
    }, [user, id])

    const checkRedirectToHome = (id: number) => {
        isLoggedIn(id)
            .then((result: boolean) => {
                if (!result) {
                    navigate("/")
                    props.handleSnackError("You must be logged in to create an auction")
                }
            })
    }


    const getAllCategories = () => {
        axios.get('http://localhost:4941/api/v1/auctions/categories')
            .then((response) => {
                setAllCategories(response.data)
            })
    }

    React.useEffect(() => {
        getAllCategories()
    }, [setAllCategories])

    const categories = () => allCategories.map((category: Category) =>
        <MenuItem key={category.categoryId} value={category.categoryId}>{category.name}</MenuItem>)

    const handleCategory = (event: SelectChangeEvent) => {
        setValues({ ...values, categoryId: event.target.value })
    }

    const handleEndDate = (date: Date | null) => {
        setEndDate(date);
        if (date !== null) {
            try {
                date.setTime(date.getTime() + 12 * 60 * 60 * 1000)
                setValues({...values, endDate: date.toISOString().replace('Z', '').replace('T', ' ')})
            } catch {}
        }
    }

    const handleChange =
        (value: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
            setValues({ ...values, [value]: event.target.value });
            if (value === 'reserve') {
                checkReserve(event.target.value)
            }
        };

    const checkReserve = (reserve: any) => {
        if (reserve === null) {
            reserve = values.reserve
        }
        if (isNaN(reserve) || (values.reserve.toString() !== "" && (reserve < 1 || !Number.isSafeInteger(parseFloat(String(reserve))) || reserve >= Math.pow(2, 31)))) {
            setReserveError("Must be a whole number $1 or more.")
            if (reserve >= Math.pow(2, 31)) {
                setReserveError(`Maximum reserve is $${Math.pow(2, 31)-1}`)
            }
            return false
        }
        setReserveError("")
        return true
    }

    const checkInput = (): boolean => {
        let hasError = false;
        if (values.title.length <= 0) {
            setTitleError("Must not be empty.")
            hasError = true;
        } else {
            setTitleError("")
        }
        if (values.description.length <= 0) {
            setDescriptionError("Must not be empty.")
            hasError = true
        } else {
            setDescriptionError("")
        }
        if ((endDate !== null) && (new Date()).getTime() - endDate.getTime() >= 0) {
            setEndDateError("End date cannot be in the past")
            hasError = true
        } else {
            setEndDateError("")
        }
        if (values.image === null) {
            setImageError("Please upload an image.")
            hasError = true
        } else {
            setImageError("")
        }
        if (!checkReserve(null)) {
            hasError = true
        }
        return !hasError
    }

    const handleCreate = () => {
        if (checkInput()) {
            let date = null
            if (endDate === null) {
                date = add(new Date(),{days: 7, hours: 12}).toISOString().replace('Z', '').replace('T', ' ')
            } else {
                date = new Date(endDate.getTime() + 12 * 60 * 60 * 1000).toISOString().replace('Z', '').replace('T', ' ')
            }
            axios.post('http://localhost:4941/api/v1/auctions',
                {
                    title: values.title, description: values.description, categoryId: parseInt(values.categoryId, 10),
                    endDate: date, reserve: values.reserve.toString() === "" ? 1 : values.reserve
                }, {headers: {'X-Authorization': `${Cookies.get('token')}`}})
                .then((response) => {
                    editAuctionImage(response.data.auctionId, values.image)
                        .then((imageResponse) => {
                            navigate(`/auction/${response.data.auctionId}`)
                            props.handleSnackSuccess(`Created ${values.title} auction`)
                        }, (error) => {
                            navigate(`/auction/${response.data.auctionId}`)
                            props.handleSnackError("Failed to upload image")
                        })
                }, (error) => {
                    props.handleSnackError("Failed to create auction")
                })
        }
    }

    const handleEdit = () => {
        if (checkInput() && id !== undefined) {
            let date = null
            if (endDate === null) {
                date = add(new Date(),{days: 7, hours: 12}).toISOString().replace('Z', '').replace('T', ' ')
            } else {
                date = new Date(endDate.getTime() + 12 * 60 * 60 * 1000).toISOString().replace('Z', '').replace('T', ' ')
            }
            editAuction(id, values.title, values.description, parseInt(values.categoryId, 10), date,
                values.reserve.toString() === "" ? 1 : values.reserve)
                .then((response) => {
                    if (values.image.type !== undefined) {
                        editAuctionImage(id, values.image).then((imageResponse) => {
                            navigate(`/auction/${id}`)
                            props.handleSnackSuccess(`Saved ${values.title} auction`)
                        }, (error) => {
                            navigate(`/auction/${id}`)
                            props.handleSnackError("Failed to upload image")
                        })
                    } else {
                        navigate(`/auction/${id}`)
                        props.handleSnackSuccess(`Saved ${values.title} auction`)
                    }
                }, (error) => {
                    props.handleSnackError("Failed to save auction")
                })
        }
    }

    const handleImage = (event: any) => {
        const image = event.target.files[0];
        if (["image/png", "image/jpeg", "image/gif"].includes(image.type)) {
            setImageUrl(URL.createObjectURL(image));
            setValues({...values, image: image});
            setImageError("")
        } else {
            setImageError("Please upload a .png, .jpg, .jpeg, or .gif file")
        }
    }

    const confirm_button = () => {
        if (id === undefined) {
            return <Button variant="contained" onClick={handleCreate}>Create Auction</Button>
        } else {
            return <Button variant="contained" onClick={handleEdit}>Save Auction</Button>
        }
    }

    const auctionCardStyles: CSS.Properties = {
        display: "inline-block",
        margin: "10px",
        padding: "0px",
    }

    return (
        <Box>
            <NavigationBar/>
            <br/>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Grid item xs={12}>
                        <Card sx={auctionCardStyles}>
                            <CardMedia
                                component="img"
                                height="500"
                                width="500"
                                sx={{objectFit:"contain"}}
                                image={imageUrl === "" ? "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg" : imageUrl}
                                alt="Auction hero"
                            />
                        </Card>
                    </Grid>
                    <Grid item xs={12}>
                        <label htmlFor="imageInput">
                            <input id="imageInput" multiple accept="image/jpg, image/png, image/gif" type="file" style={{ display: "none"}} onChange={handleImage}/>
                            <Typography color={"red"}>{imageError}</Typography>
                            <Button component="span" variant="contained">Upload Image</Button>
                        </label>
                    </Grid>
                </Grid>
                <Grid item xs={6}>
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <TextField label="Title"
                                       style={{width: "250px"}}
                                       variant="outlined"
                                       value={values.title}
                                       onChange={handleChange('title')}
                                       error={titleError !== "" && values.title === ""}
                                       helperText={titleError !== "" && values.title === "" ? titleError : ""}
                                       required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl style={{width: "250px"}}>
                                <InputLabel id="demo-simple-select-label">Category *</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    value={values.categoryId}
                                    label="Category *"
                                    onChange={handleCategory}
                                >
                                    {categories()}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="End Date *"
                                    value={endDate}
                                    onChange={(newValue) => {
                                        handleEndDate(newValue);
                                    }}
                                    renderInput={(params) => <TextField
                                        {...params}
                                        style={{width: "250px"}}
                                        error={endDateError !== "" && (endDate !== null) && (new Date()).getTime() - endDate.getTime() >= 0}
                                        helperText={endDateError !== "" && (endDate !== null) && (new Date()).getTime() - endDate.getTime() >= 0 ? endDateError : ""}
                                    />}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Description" variant="outlined" onChange={handleChange('description')}
                                       style={{width: "250px"}}
                                       error={descriptionError !== "" && values.description === ""}
                                       helperText={descriptionError !== "" && values.description === "" ? descriptionError : ""}
                                       required value={values.description}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Reserve" variant="outlined" value={values.reserve} onChange={handleChange('reserve')}
                                       style={{width: "250px"}}
                                       error={reserveError !== "" && (isNaN(values.reserve) || (values.reserve.toString() !== "" && (values.reserve < 1 || !Number.isSafeInteger(parseFloat(String(values.reserve))) || values.reserve >= Math.pow(2, 31))))}
                                       helperText={reserveError !== "" && (isNaN(values.reserve) || (values.reserve.toString() !== "" && (values.reserve < 1 || !Number.isSafeInteger(parseFloat(String(values.reserve))) || values.reserve >= Math.pow(2, 31)))) ? reserveError : ""}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography color={"red"}>{values.error}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            {confirm_button()}
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    )
}
export default CreateAuctionPage;