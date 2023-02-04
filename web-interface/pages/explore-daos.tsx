import { Button, Container, Grid, Skeleton, Text, Title } from "@mantine/core";
import Head from "next/head";
import { Layout } from "../components/Layout";
import { useContext, useEffect, useState } from "react";
import SpaceCard from "../components/SpaceCard";
import { useAccount, useSigner } from "wagmi";
import { GlobalContext } from "../contexts/GlobalContext";
import {useContract} from "../hooks/useContract";
import { useIsMounted } from '../hooks/useIsMounted';
import {useRouter} from "next/router";

export default function ExploreSpaces() {
  const [data, setData] = useState<any>(null)
  const { data: signer } = useSigner()
  const { isDisconnected, isConnecting, isConnected } = useAccount()
  const {getDataDaos} = useContract()
  const isMounted = useIsMounted()
  const router = useRouter()

  useEffect(() => {
    if (isDisconnected) {
      alert("Please connect your wallet")
      router.back()
      return
    }
  }, [isConnected, isConnecting, isDisconnected])

  useEffect(() => {
    if(!signer) return
    console.log(isMounted)
    if(!isMounted) return
    getDAOs()
  }, [isMounted,signer]);

  // @ts-ignore
  const { orbis, user, setUser } = useContext(GlobalContext);


  const getDAOs =async () => {
    var res = await getDataDaos()
    console.log(res)
    setData(res)
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

  let renderSpaces;
  if (data?.length > 0) {
    renderSpaces = data?.map((nft: any, index: number) => {
      return (
        <Grid.Col key={index} lg={4} md={6}>
          <SpaceCard
            title={nft[1]}
            address={nft[0]}
            groupId={nft[2]}
          />
        </Grid.Col>
      );
    });
  } else {
    renderSpaces = (
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
        <title>Explore DataDAOa - spatialDAO</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <Layout>
        <Container size={"xl"} p={"xl"}>
          <Title>Explore DataDAOs</Title>
          <Grid gutter={"xl"}>{renderSpaces}</Grid>
        </Container>
      </Layout>
    </>
  );
}
