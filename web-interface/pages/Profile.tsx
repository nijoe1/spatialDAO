import Head from 'next/head'
import {Layout} from "../components/Layout";
import {useAccount} from "wagmi";
import {useContext, useEffect, useState} from "react";
import NftCard from "../components/NftCard"
import {Button, Center, Container, createStyles, Grid, Modal, Skeleton, Tabs, Text, Title} from "@mantine/core";
import {UpdateProfile} from "../components/UpdateProfile";
import {GlobalContext} from "../contexts/GlobalContext";
import CreatorCard from "../components/CreatorCard";
import {useRouter} from "next/router";
import StyledTabs from "../components/StyledTabs";
import {IconAlbum, IconCreditCard, IconGeometry, IconMessageChatbot} from "@tabler/icons";
import UserPosts from "../components/UserPosts";
import UserVcs from '../components/UserVcs';

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

export default function MyNft() {
    const {classes} = useStyles();
    const {address, isDisconnected} = useAccount()
    const [nfts, setNfts] = useState<Array<any>>()
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const router = useRouter()
    // @ts-ignore
    const {user, setUser, orbis, group_id} = useContext(GlobalContext)

    const logout = async () => {
        if (isDisconnected) {
            let res = await orbis.isConnected()
            if (res.status == 200) {
                await orbis.logout()
                setUser(null)
            }
        }
    }

    useEffect(() => {
        logout()
    }, [isDisconnected])

    async function getProvider() {
        let provider = null;

        if (window.ethereum) {
            provider = window.ethereum;

            /** Return provider to use */
            return provider;
        }
    }

    const connect = async () => {
        let provider = await getProvider();
        let res = await orbis.connect_v2({provider, network: 'ethereum', lit: false});
        if (res.status == 200) {
            setUser(res.did);
            let {data, error} = await orbis.getIsGroupMember(group_id, res.did)
            if (!data) {
                await orbis.setGroupMember(group_id, true)
            }
        } else {
            console.log("Error connecting to Ceramic: ", res);
            alert("Error connecting to Ceramic.");
        }
    }

    const orbisConnect = async () => {
        let res = await orbis.isConnected()
        if (res !== false) return
        connect()
    }

    useEffect(() => {
        if (!router.isReady) return
        if (isDisconnected) return
        orbisConnect()
    }, [router.isReady])


    const updateProfileModal = (
        <Modal
            opened={isProfileModalOpen}
            className={classes.modal}
            transition="fade"
            transitionDuration={500}
            transitionTimingFunction="ease"
            onClose={() => setIsProfileModalOpen(false)}
        >
            <Center>
                <UpdateProfile/>
            </Center>
        </Modal>
    )
    return (
        <>
            <Head>
                <title>Profile - spatialDAO</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width"/>
            </Head>
            <Layout>
                {/*// @ts-ignore*/}
                <Container className={classes.container}>
                    <h1>Profile</h1>
                    {isDisconnected && <Text>Please connect your wallet to view your profile</Text>}
                    {!isDisconnected &&
                        <Container size={"xl"}>
                            <Grid>
                                <Grid.Col lg={8}>
                                    <CreatorCard image={user?.profile?.pfp} name={user?.profile?.username}
                                                 email={user?.metadata?.address}/>
                                </Grid.Col>
                                <Grid.Col lg={4}>
                                    <Button.Group p={"xl"} sx={{height: "100%"}}>
                                        <Button color={"indigo"} sx={{height: "-webkit-fill-available"}}
                                                onClick={() => setIsProfileModalOpen(true)}>
                                            Update Your Profile
                                        </Button>
                                        <Button color={"indigo"} variant={"light"} sx={{height: "-webkit-fill-available"}}
                                                onClick={() => window.open("https://passport.gitcoin.co/", "_blank")}>
                                            Issue Gitcoin VC
                                        </Button>
                                    </Button.Group>
                                </Grid.Col>
                            </Grid>
                            <StyledTabs defaultValue={"nfts"}>
                                <Center>
                                    <Tabs.List>
                                        <Tabs.Tab value={"chat"} icon={<IconMessageChatbot size={16}/>}>Your Posts</Tabs.Tab>
                                        <Tabs.Tab value={"vcs"} icon={<IconCreditCard size={16}/>}>Your VCs</Tabs.Tab>
                                    </Tabs.List>
                                </Center>
                                <Tabs.Panel value={"chat"}>
                                    <UserPosts />
                                </Tabs.Panel>
                                <Tabs.Panel value={"vcs"}>
                                    <UserVcs />
                                </Tabs.Panel>
                            </StyledTabs>
                        </Container>}
                    {updateProfileModal}
                    {/*{attributeModal}*/}
                </Container>
            </Layout>
        </>
    )
}
