import {Button, Center, Container, createStyles, Grid, Skeleton, Stack, Tabs, Text, Title} from "@mantine/core";
import Head from "next/head";
import {Layout} from "../components/Layout";
import {useRouter} from "next/router";
import {useContext, useEffect, useState} from "react";
import NftCard from "../components/NftCard";
import CreatorCard from "../components/CreatorCard";
import StyledTabs from "../components/StyledTabs";
import {
    IconAlbum,
    IconMessageChatbot,
    IconUnlink
} from "@tabler/icons";
import {useAccount} from "wagmi";
import {GlobalContext} from "../contexts/GlobalContext";
import {showNotification} from "@mantine/notifications"
import GroupPosts from "../components/GroupPosts";
import CollaborationRequests from "../components/CollaborationRequests";
import Proposals from "../components/Proposals";

let orbisGroup = "https://app.orbis.club/group/"

const useStyles = createStyles((theme) => ({
    btn: {
        [theme.fn.smallerThan('md')]: {
            height: 50,
            margin: theme.spacing.md
        },
        height: "-webkit-fill-available",
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        width: "100%"
    },
    grid: {
        [theme.fn.smallerThan('md')]: {
            width: "100%"
        }
    },
    btnGrp: {
        [theme.fn.smallerThan('md')]: {
            display: "none"
        }
    },
    btnGrpMobile: {
        [theme.fn.smallerThan('md')]: {
            display: "block"
        },
        [theme.fn.largerThan('md')]: {
            display: "none"
        }
    }
}))

export default function Space() {
    const {classes} = useStyles()
    const router = useRouter()
    const {isConnected, isConnecting, isDisconnected, address} = useAccount()
    const [proposalPosts, setProposalPosts] = useState<any>([])
    const [spaceName, setSpaceName] = useState("")
    const [mounted, setMounted] = useState(false)
    const [isOwner, setIsOwner] = useState<boolean>(false)
    const [isGroupMember, setIsGroupMember] = useState(false)
    const [groupDesc, setGroupDesc] = useState("")
    const [spaceMember, setSpaceMember] = useState(false)
    const [renderCreator, setRenderCreator] = useState(<>
        <Skeleton height={50} circle mb="xl"/>
        <Skeleton height={8} radius="xl"/>
        <Skeleton height={8} mt={6} radius="xl"/>
        <Skeleton height={8} mt={6} width="70%" radius="xl"/>
    </>)
    // @ts-ignore
    const {orbis, user, setUser} = useContext(GlobalContext)

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
        logout()
    }, [isDisconnected])

    const getProfile = async (address: string) => {
        let {data} = await orbis.getGroup(address)
        if (data) {
            return data
        }

    }

    useEffect(() => {
        if (!router.isReady) return
        const {groupId , address} = router.query
        // @ts-ignore
        getProfile(groupId).then(res => {
            if (!res) return
            if (typeof res["details"] === "string") {
                // @ts-ignore
                setRenderCreator(<CreatorCard email={router.query.address}/>)
            } else {
                {/*@ts-ignore*/}
                setRenderCreator(<CreatorCard image={res?.content?.pfp} name={res?.content?.name} email={address!}/>)
            }
        })
    }, [router.isReady])

    useEffect(() => {
        (async () => {
            if (!router.isReady) return
            if (router.query.address == address?.toLowerCase()) setIsOwner(true)
            // const spaceMember = await isSpaceMember(router.query.id as string, address)
            console.log("Space member: ", spaceMember);
            setSpaceMember(spaceMember)
            let {data: dids} = await orbis.getDids(address)
            const user = dids[0].did
            const {groupId} = router.query
            let {data: group} = await orbis.getGroup(groupId)
            setGroupDesc(group.content.description)
            let {data, error} = await orbis.getIsGroupMember(groupId, user)
            console.log("Is group member: ", data);
            if (data) {
                setIsGroupMember(data)
            }
        })()
    }, [router.isReady, isConnected, address, orbis, user])

    useEffect(() => {
        if (!router.isReady) return;
        const {id, groupId} = router.query
        orbis.getPosts({
            context: groupId,
            tag: "spatialDAOProposal"
        }).then((res: { data: any; }) => {
            console.log("Proposal posts: ", res);
            setProposalPosts(res.data)
        })
        // @ts-ignore
        setSpaceName(id)
        setMounted(true)
    }, [router.isReady])

    let renderNfts
    if(proposalPosts.length > 0) {
        renderNfts = proposalPosts.map((post: any) => {
            const commP = post.content.tags[1].title
            const filesize = post.content?.tags[2]?.id
            return <NftCard title={commP} tokenId={filesize} description={post.content.body} />
        })
    }
    

    const handleJoin = async () => {
        const {groupId} = router.query
        const res = await orbis.setGroupMember(groupId, true)
        if (res.status === 200) {
            showNotification({
                title: "Success",
                message: "You have successfully joined the group",
            })
            router.reload()
        } else {
            showNotification({
                title: "Error",
                message: "Something went wrong",
            })
            router.reload()
        }
    }

    const handleLeave = async () => {
        const {groupId} = router.query
        const res = await orbis.setGroupMember(groupId, false)
        if (res.status === 200) {
            showNotification({
                title: "Success",
                message: "You have successfully left the group",
            })
        } else {
            showNotification({
                title: "Error",
                message: "Something went wrong",
            })
        }
    }

    const buttons =
        <>
            {!user &&
                <Button onClick={() => router.push('/discussions')} color={"indigo"} sx={{height: "-webkit-fill-available"}}
                        variant={"light"}
                        className={classes.btn}>
                    Connect to Orbis
                </Button>}
            {user && isGroupMember &&
                <Button variant={"light"} onClick={handleLeave} color={"indigo"} sx={{height: "-webkit-fill-available"}}
                        className={classes.btn}>
                    Leave Space
                </Button>}
            {user && !isGroupMember &&
                <Button variant={"light"} onClick={handleJoin} color={"indigo"}
                        className={classes.btn}>
                    Join Space
                </Button>}
            <Button variant={"subtle"} component={"a"} href={orbisGroup} target={"_blank"}
                    color={"indigo"} className={classes.btn}>
                Go to Space Chat
            </Button>
        </>

    return (
        <>
            <Head>
                <title>spatialDAO</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width"/>
            </Head>
            <Layout>
                {/*@ts-ignore*/}
                <Container size={"85%"}>
                    <Title>{spaceName}</Title>
                    {mounted && <Stack>
                        <Grid>
                            <Grid.Col lg={6}>
                                {renderCreator}
                            </Grid.Col>
                            <Grid.Col lg={6}>
                                <Button.Group sx={{height: "100%"}} className={classes.btnGrp}>
                                    {buttons}
                                </Button.Group>
                                <div className={classes.btnGrpMobile}>
                                    {buttons}
                                </div>
                            </Grid.Col>
                        </Grid>
                    </Stack>}
                    {!isGroupMember &&
                        <Text sx={{fontStyle: "italic", color: "red"}} mb={"md"}>Join space to make collaboration
                            requests and give your opinions on the polls.</Text>}
                    <Text m={"xl"} mb={"md"}>{groupDesc}</Text>
                    <Stack>
                        <StyledTabs defaultValue={"nfts"}>
                            <Center>
                                <Tabs.List mb={"sm"}>
                                    <Tabs.Tab key={1} value={"nfts"} icon={<IconAlbum size={16}/>}>Proposals and Bounties</Tabs.Tab>
                                    <Tabs.Tab key={4} value={"chat"} icon={<IconMessageChatbot size={16}/>}
                                             >Group Chat</Tabs.Tab>
                                    <Tabs.Tab value={"collab"} icon={<IconUnlink size={16}/>}>Collaboration Requests</Tabs.Tab>
                                    <Tabs.Tab value={"proposal"} icon={<IconUnlink size={16}/>}>Create Proposals</Tabs.Tab>
                                </Tabs.List>
                            </Center>
                            <Tabs.Panel value={"nfts"}>
                                <Grid gutter={"xl"}>
                                    {renderNfts}
                                </Grid>
                            </Tabs.Panel>
                            <Tabs.Panel value={"chat"}>
                                <GroupPosts spaceMember={spaceMember}/>
                            </Tabs.Panel>
                            <Tabs.Panel value={"collab"}>
                                <CollaborationRequests/>
                            </Tabs.Panel>
                            <Tabs.Panel value={"proposal"}>
                                <Proposals/>
                            </Tabs.Panel>
                        </StyledTabs>
                    </Stack>
                </Container>
            </Layout>
        </>
    )
}
