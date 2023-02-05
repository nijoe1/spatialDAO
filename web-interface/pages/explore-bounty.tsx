import { Button, Container, Grid, Skeleton, Text, Title } from "@mantine/core";
import Head from "next/head";
import { Layout } from "../components/Layout";
import { useContext, useEffect, useState } from "react";
import SpaceCard from "../components/SpaceCard";
import { useAccount, useSigner } from "wagmi";
import { GlobalContext } from "../contexts/GlobalContext";
import { useIsMounted } from '../hooks/useIsMounted';
import {useRouter} from "next/router";
import BountyCard from "../components/BountyCard";

export default function ExploreSpaces() {
    const [data, setData] = useState<any>(null)
    const { data: signer } = useSigner()
    const { isDisconnected, isConnecting, isConnected } = useAccount()
    const isMounted = useIsMounted()
    const router = useRouter()

    // @ts-ignore
    const { orbis, user, setUser } = useContext(GlobalContext);

    useEffect(() => {
        if (isDisconnected) {
            alert("Please connect your wallet")
            router.push("/")
            return
        }
    }, [isConnected, isConnecting, isDisconnected])

    useEffect(() => {
        if(!signer) return
        console.log(isMounted)
        if(!isMounted) return
        getBounties()
    }, [isMounted,signer]);

    const getBounties = async () => {
        const res = await orbis.getPosts({context: "kjzl6cwe1jw14bfjlshsudnd99ozw3zz7p2buayz9x8lmyc5blj6wiiuifcday1", tag: "spatialDaoAllBounties"})
        setData(res.data)
    }
    const logout = async () => {
        if (isDisconnected) {
            let res = await orbis.isConnected();
            if (res.status == 200) {
                await orbis.logout();
                setUser(null);
                // console.log("User is connected: ", res);
            }
        }
    };

    useEffect(() => {
        logout();
    }, [isDisconnected]);

    let renderBounties;
    if (data?.length > 0) {
        renderBounties = data?.map((bounty: any, index: number) => {
            console.log(bounty)
            return (
                <Grid.Col key={index} lg={4} md={6}>
                    <BountyCard query={bounty.content.tags[6]?.title} daoAddress={bounty.content.tags[5].title} streamId={bounty.streamId} title={bounty.content.tags[1].title} description={bounty.content.body} timestamp={bounty.timestamp} />
                </Grid.Col>
            );
        });
    } else {
        renderBounties = (
            <>
                <Skeleton height={350} width={350} m={"xl"} radius={"xl"} />
                <Skeleton height={350} width={350} m={"xl"} radius={"xl"} />
                <Skeleton height={350} width={350} m={"xl"} radius={"xl"} />
                <Skeleton height={350} width={350} m={"xl"} radius={"xl"} />
                <Skeleton height={350} width={350} m={"xl"} radius={"xl"} />
                <Skeleton height={350} width={350} m={"xl"} radius={"xl"} />
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Explore Bounties - spatialDAO</title>
                <meta
                    name="viewport"
                    content="minimum-scale=1, initial-scale=1, width=device-width"
                />
            </Head>
            <Layout>
                <Container size={"xl"} p={"xl"}>
                    <Title>Explore Bounties</Title>
                    <Grid gutter={"xl"}>{renderBounties}</Grid>
                </Container>
            </Layout>
        </>
    );
}