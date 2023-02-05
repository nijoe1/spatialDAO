import Head from 'next/head'
import {Layout} from "../components/Layout";
import {useContext, useEffect, useState} from "react";
import ProposalCard from "../components/ProposalCard"
import {
    Blockquote,
    Button,
    Center,
    Container,
    createStyles,
    Grid,
    Skeleton,
    Stack,
    Tabs,
    Text,
    Title
} from "@mantine/core";
import {GlobalContext} from "../contexts/GlobalContext";
import CreatorCard from "../components/CreatorCard";
import {useRouter} from "next/router";
import {useIsMounted} from "../hooks/useIsMounted";
import StyledTabs from "../components/StyledTabs";
import {
    IconAlbum,
    IconCreditCard,
    IconFilePencil,
    IconGeometry,
    IconMessageChatbot,
    IconTallymarks
} from "@tabler/icons";
import UserPosts from "../components/UserPosts";
import {useAccount} from "wagmi";
import {showNotification, updateNotification} from "@mantine/notifications";
import UserVcs from "../components/UserVcs";
const useStyles = createStyles((theme) => ({
    container: {
        [theme.fn.smallerThan('md')]: {
            maxWidth: "100%"
        },
        maxWidth: "85%"
    },
    modal: {
        [theme.fn.smallerThan('md')]: {
            maxWidth: "100%"
        }
    },
    btn: {
        [theme.fn.smallerThan('md')]: {
            height: 50,
            margin: theme.spacing.md
        },
        width: "75%",
        height: "-webkit-fill-available",
        margin: theme.spacing.xl
    }
}))

export default function User() {
    const {classes} = useStyles();
    const {address: guestAddress, isDisconnected} = useAccount()
    const [isFollowing, setIsFollowing] = useState(false)
    const [username, setUsername] = useState("User")
    const [userDid, setUserDid] = useState("")
    const [userAddress, setUserAddress] = useState("")
    const [userDescription, setUserDescription] = useState("")
    const mounted = useIsMounted()
    const router = useRouter()
    const [renderUser, setUserRender] = useState<any>(<>
        <Skeleton height={50} circle mb="xl"/>
        <Skeleton height={8} radius="xl"/>
        <Skeleton height={8} mt={6} radius="xl"/>
        <Skeleton height={8} mt={6} width="70%" radius="xl"/>
    </>)
    // @ts-ignore
    const {orbis, setUser, user} = useContext(GlobalContext)

    async function getProvider() {
        let provider = null;

        if (window.ethereum) {
            provider = window.ethereum;

            /** Return provider to use */
            return provider;
        }
    }

    const connect = async () => {
        if (user) return
        let provider = await getProvider();
        let res = await orbis.connect_v2({provider, network: 'ethereum', lit: false});
        if (res.status == 200) {
            setUser(res.did);
        } else {
            console.log("Error connecting to Ceramic: ", res);
            alert("Error connecting to Ceramic.");
        }
    }

    const logout = async () => {
        if (isDisconnected) {
            let res = await orbis.isConnected()
            if (res.status == 200) {
                await orbis.logout()
                setUser(null)
                console.log("User is connected: ", res);
            }
        }
    }

    useEffect(() => {
    }, [isDisconnected])

    const getIsFollowing = async (address: `0x${string}`) => {
        let {data: guestDids} = await orbis.getDids(guestAddress)
        const guest = guestDids[0].did
        let {data: dids} = await orbis.getDids(address)
        const user = dids[0].did
        setUserDid(user)
        const {data: isFollowing, error} = await orbis.getIsFollowing(guest, user)
        setIsFollowing(isFollowing)
    }
    const getProfile = async (address: `0x${string}`) => {
        let {data: dids} = await orbis.getDids(address)
        let {data, error} = await orbis.getProfile(dids[0].did)
        if (typeof data["details"] === "string") {
            setUserRender(<CreatorCard email={address}/>)
            setUsername("User")
        } else {
            setUserRender(<CreatorCard email={address} image={data?.details?.profile?.pfp} name={data?.username}/>)
            setUsername(data?.username || "User")
            setUserDescription(data?.details?.profile?.description || "")
        }
    }

    const handleFollow = async () => {
        showNotification({
            id: "follow",
            title: "Following...",
            message: "Please wait while we follow this user",
            loading: true,
            disallowClose: true,
            autoClose: false
        })
        await connect()
        let res = await orbis.setFollow(userDid, !isFollowing)
        if (res.status === 200) {
            updateNotification({
                id: "follow",
                title: "Success!",
                message: `You are now ${isFollowing ? "un" : ""}following this user`,
                color: "green",
                autoClose: 5000
            })
            setIsFollowing(!isFollowing)
        } else {
            updateNotification({
                id: "follow",
                title: "Error",
                message: "Something went wrong",
                color: "red",
                autoClose: 5000
            })
        }
    }

    const handleChat = async () => {
        showNotification({
            id: "chat",
            title: "Opening chat...",
            message: "Please wait while we open the chat",
            loading: true,
            disallowClose: true,
            autoClose: false
        })
        await connect()
        const {data, error} = await orbis.getConversations({
            did: userDid,
            context: "tcs-init-conversation"
        })
        if (data.length === 0) {
            const res = await orbis.createConversation({
                recipients: [userDid, user.did],
                title: `Chat with ${username}`,
                description: `Chat created from spatialDAO`,
                context: "tcs-init-conversation"
            })
            if (res.status === 200) {
                updateNotification({
                    id: "chat",
                    title: "Success!",
                    message: "Chat created",
                    color: "green",
                    autoClose: 5000
                })
                window.open(`https://app.orbis.club/messages/${res.doc}`, "_blank")
            } else {
                updateNotification({
                    id: "chat",
                    title: "Error",
                    message: "Something went wrong",
                    color: "red",
                    autoClose: 5000
                })
            }
        } else {
            window.open(`https://app.orbis.club/messages/${data[0].stream_id}`, "_blank")
            updateNotification({
                id: "chat",
                title: "Success!",
                message: "Chat created",
                color: "green",
                autoClose: 5000
            })
        }
    }

    useEffect(() => {
        if (!mounted) return
        if (router.query.address) {
            const address = router.query.address as `0x${string}`
            setUserAddress(address)
            getProfile(address)
            getIsFollowing(address)
        }
    }, [mounted, router.isReady])


   

    return (
        <>
            <Head>
                <title>{username}'s Profile - spatialDAO</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width"/>
            </Head>
            <Layout>
                {/*// @ts-ignore*/}
                <Container className={classes.container}>
                    <Title>{username}'s Profile</Title>
                    <Container size={"xl"}>
                        <Grid>
                            <Grid.Col lg={8}>
                                {renderUser}
                            </Grid.Col>
                            <Grid.Col lg={4}>
                                <Button.Group p={"xl"} sx={{height: "100%"}}>
                                    <Button color={"indigo"} onClick={handleFollow} sx={{height: "-webkit-fill-available", width: "100%"}}>
                                        {isFollowing ? "Unfollow" : "Follow"}
                                    </Button>
                                    <Button color={"indigo"} variant={"light"} sx={{height: "-webkit-fill-available", width: "100%"}} onClick={handleChat}>
                                        Connect Over Chat
                                    </Button>
                                </Button.Group>
                            </Grid.Col>
                        </Grid>
                        <Blockquote>{userDescription}</Blockquote>
                        <Stack>
                            <StyledTabs defaultValue={"chat"}>
                                <Center>
                                    <Tabs.List>
                                        <Tabs.Tab value={"chat"} icon={<IconMessageChatbot size={16}/>}>User
                                            Posts</Tabs.Tab>
                                        <Tabs.Tab value={"vcs"} icon={<IconCreditCard size={16}/>}>User VCs</Tabs.Tab>
                                    </Tabs.List>
                                </Center>
                                <Tabs.Panel value={"chat"}>
                                    <UserPosts/>
                                </Tabs.Panel>
                                <Tabs.Panel value={"vcs"}>
                                    <UserVcs address={router.query.address as string}/>
                                </Tabs.Panel>
                            </StyledTabs>
                        </Stack>
                    </Container>
                </Container>
            </Layout>
        </>
    )
}
