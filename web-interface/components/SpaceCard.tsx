interface NftCardProps {
    title: string;
    address: string;
    groupId: string;
}

import { useState,useContext,useEffect } from 'react';
import {Card,
    Text,
    createStyles, Image, Tooltip,
} from '@mantine/core';
import { GlobalContext } from '../contexts/GlobalContext';


const useStyles = createStyles((theme) => ({
    card: {
        position: 'relative',
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        maxWidth: 350
    },

    rating: {
        position: 'absolute',
        top: theme.spacing.xs,
        right: theme.spacing.xs + 2,
        pointerEvents: 'none',
    },

    title: {
        display: 'block',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs / 2,
    },

    action: {
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        ...theme.fn.hover({
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
        }),
    },

    footer: {
        marginTop: theme.spacing.md,
    },
}));

export default function SpaceCard({ title, address, groupId}: NftCardProps & Omit<React.ComponentPropsWithoutRef<'div'>, keyof NftCardProps>) {
      // @ts-ignore
    const {orbis, user, setUser} = useContext(GlobalContext)
    const {classes, cx, theme} = useStyles();
    const [image,setImage] = useState(""); 
    
    useEffect(() => {
        (async () => {
            
            let {data: group} = await orbis.getGroup(groupId)
            setImage(group.content.pfp)

        })()
    }, [address, orbis, user])

    const linkProps = {href: `/space/?id=${title}&address=${address}&groupId=${groupId}`, rel: 'noopener noreferrer'};

    return (
        <Card withBorder radius="md" className={cx(classes.card)} m={"md"}>
            <Card.Section>
                <a {...linkProps}>
                    <Image height={350} width={350} src={image} alt={title}/>
                </a>
            </Card.Section>

            <Tooltip label={"View Space"}>
                <Text className={classes.title} weight={500} component="a" {...linkProps}>
                    {title}
                </Text>
            </Tooltip>

        </Card>
    );
}