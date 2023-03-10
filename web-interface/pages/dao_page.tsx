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
    Title
} from "@mantine/core";
import {useContract} from '../hooks/useContract';
import Head from "next/head";
import {Layout} from "../components/Layout";
import {useRouter} from "next/router";
import {useContext, useEffect, useState} from "react";
import ProposalCard from "../components/ProposalCard";
import CreatorCard from "../components/CreatorCard";
import StyledTabs from "../components/StyledTabs";
import {
    IconAlbum, IconHeartHandshake,
    IconMessageChatbot, IconMoneybag,
    IconUnlink
} from "@tabler/icons";
import {useSigner,useAccount} from "wagmi";
import { ethers} from "ethers";
import {DAO_abi} from "../constants";
import {GlobalContext} from "../contexts/GlobalContext";
import {showNotification} from "@mantine/notifications"
import GroupPosts from "../components/GroupPosts";
import CollaborationRequests from "../components/CollaborationRequests";
import Proposals from "../components/Proposals";
import BountyCard from "../components/BountyCard";
import MonetizeDAO from "../components/MonetizeDAO";

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
    const {data: signer} = useSigner()
    const {isConnected, isConnecting, isDisconnected, address} = useAccount()
    const {checkProposerRole} = useContract()
    const [proposalPosts, setProposalPosts] = useState<any>([])
    const [bountyPosts, setBountyPosts] = useState<any>([])
    const [spaceName, setSpaceName] = useState("")
    const [mounted, setMounted] = useState(false)
    const [isGroupMember, setIsGroupMember] = useState(false)
    const [groupDesc, setGroupDesc] = useState("")
    const [groupId, setGroupId] = useState("")
    const [spaceMember, setSpaceMember] = useState(false)
    const [admin, setAdmin] = useState(false)
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
        if (isDisconnected) {
            alert("Please connect your wallet")
            router.push("/")
            return
        }
    }, [isConnected, isConnecting, isDisconnected])

    useEffect(() => {
        if (!router.isReady) return
        const {groupId , address} = router.query
        setGroupId(groupId as string)
        getProfile(groupId! as string).then(res => {
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
            console.log(address)
            const contract =  new ethers.Contract(router.query.address as string, DAO_abi, signer!)
            setAdmin(await checkProposerRole(contract, address as string))
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
            // console.log("Proposal posts: ", res);
            setProposalPosts(res.data)
        })
        orbis.getPosts({
            context: groupId,
            tag: "spatialDAOBounty"
        }).then((res: { data: any; }) => {
            // console.log("Bounty posts: ", res);
            setBountyPosts(res.data)
        })
        // @ts-ignore
        setSpaceName(id)
        setMounted(true)
    }, [router.isReady])

    let renderProposals
    if(proposalPosts.length > 0) {
        console.log("Proposal posts: ", proposalPosts)
        renderProposals = proposalPosts.map((post: any, index: number) => {
            const commP = post.content.tags[1].title
            const filesize = post.content?.tags[2]?.title
            const streamId = post.stream_id
            const endDate = post.content?.tags[4]?.title
            return <ProposalCard key={index + 99999} timestamp={post.timestamp} streamId={streamId} endDate={endDate} title={commP} tokenId={filesize} description={post.content.body} />
        })
    }

    let renderBounties
    if(bountyPosts.length > 0) {
        renderBounties = bountyPosts.map((post: any, index: number) => {
            const commP = post.content.tags[1].title
            return <BountyCard key={index + 9999} streamId={post.streamId} timestamp={post.timestamp} title={commP} description={post.content.body} />
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
                    Unfollow DAO
                </Button>}
            {user && !isGroupMember &&
                <Button variant={"light"} onClick={handleJoin} color={"indigo"}
                        className={classes.btn}>
                    Follow DAO
                </Button>}
            <Button variant={"subtle"} component={"a"} href={`${orbisGroup}`+"/"+`${groupId}`} target={"_blank"}
                    color={"indigo"} className={classes.btn}>
                Go to DAO groupChat
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

                    <Blockquote>{groupDesc}</Blockquote>
                    <Stack>
                        <StyledTabs defaultValue={"proposals"}>
                            <Center>
                                <Tabs.List mb={"sm"}>
                                    <Tabs.Tab key={1} value={"proposals"} icon={<IconAlbum size={16}/>}>Proposals</Tabs.Tab>
                                    <Tabs.Tab key={2} value={"bounties"} icon={<IconMoneybag size={16}/>}>Bounties</Tabs.Tab>
                                    <Tabs.Tab key={4} value={"chat"} icon={<IconMessageChatbot size={16}/>}>Group Chat</Tabs.Tab>
                                    {admin && <Tabs.Tab key={5} value={"proposal"} icon={<IconUnlink size={16}/>}>Create Proposal</Tabs.Tab>}
                                    <Tabs.Tab key={3} value={"collab"} icon={<IconHeartHandshake size={16}/>}>Collab Request</Tabs.Tab>
                                    {admin && <Tabs.Tab key={6} value={"monetize"} icon={ <IconMoneybag size={16}/>}>Monetize</Tabs.Tab>}
                                </Tabs.List>
                            </Center>
                            <Tabs.Panel value={"proposals"}>
                                <Grid gutter={"xl"}>
                                    {renderProposals}
                                </Grid>
                            </Tabs.Panel>
                            <Tabs.Panel value={"bounties"}>
                                <Grid gutter={"xl"}>
                                    {renderBounties}
                                </Grid>
                            </Tabs.Panel>
                            <Tabs.Panel value={"chat"}>
                                <GroupPosts spaceMember={spaceMember}/>
                            </Tabs.Panel>
                            <Tabs.Panel value={"proposal"}>
                                <Proposals/>
                            </Tabs.Panel>
                            <Tabs.Panel value={"collab"}>
                                <CollaborationRequests />
                            </Tabs.Panel>
                            <Tabs.Panel value={"monetize"}>
                                <MonetizeDAO />
                            </Tabs.Panel>
                        </StyledTabs>
                    </Stack>
                </Container>
            </Layout>
        </>
    )
}
