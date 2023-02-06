import {Center, Checkbox, Container, Group, NativeSelect, Title} from "@mantine/core";
import {useRouter} from "next/router";
import {useContext, useEffect, useState} from "react";
import PostInput from "./PostInput";
import {useIsMounted} from "../hooks/useIsMounted";
import {GlobalContext} from "../contexts/GlobalContext";
import PostCard from "./PostCard";
import {useAccount} from "wagmi";


export default function UserPosts() {
    const router = useRouter()
    const [isDashboard, setIsDashboard] = useState(true)
    const {address} = useAccount()
    const [data, setData] = useState<any>()
    const isMounted = useIsMounted()

    // @ts-ignore
    const {orbis} = useContext(GlobalContext)
    const getPosts = async (address: string) => {
        const res = await orbis.getPosts({context: address.toLowerCase(), tag: address.toLowerCase()})
        if (res.status === 200) {
            setData(res.data)
        } else {
            setData([])
        }
    }

    useEffect(() => {
        if (!isMounted) return
        if (router.pathname === "/profile") {
            setIsDashboard(true)
            getPosts(address as string)
        }
        if (router.pathname === "/user") {
            if (!router.query.address) return
            getPosts(router.query.address as string)
            return;
        }
    }, [isMounted, address, router.isReady])
    return (
        <Container>
            {isDashboard &&
                <PostInput spaceName={""} groupId={address as string} tag={address as string}/>}
            {isDashboard && <div style={{
                marginTop: -60
            }}></div>}
            <>
                {
                    data?.map((post: any, index: number) => {
                        return (
                            <PostCard address={address as string} key={index} post={post}/>
                        )
                    })
                }
                {
                    data?.length === 0 && (
                        <Center mt={45}>
                            <Title order={3}>No posts yet</Title>
                        </Center>
                    )
                }
            </>
        </Container>
    )
}