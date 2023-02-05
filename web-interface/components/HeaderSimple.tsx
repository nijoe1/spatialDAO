import {
    createStyles,
    Header,
    Group,
    Center,
    Image,
    Burger, Title, Transition, Paper, Stack
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {ConnectButton} from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import {useRouter} from "next/router";
import {IconArtboard, IconHammer, IconMapSearch, IconMessageDots} from "@tabler/icons";
import {useState} from "react";

const HEADER_HEIGHT = 60;

const useStyles = createStyles((theme) => ({
    dropdown: {
        position: 'absolute',
        top: HEADER_HEIGHT,
        left: 0,
        right: 0,
        zIndex: 0,
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        borderTopWidth: 0,
        overflow: 'hidden',

        [theme.fn.largerThan('sm')]: {
            display: 'none',
        },
    },

    link: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
        textDecoration: 'none',
        color: theme.colorScheme === 'dark' ? theme.white : theme.black,
        fontWeight: 500,
        fontSize: theme.fontSizes.sm,

        [theme.fn.smallerThan('sm')]: {
            height: 42,
            display: 'flex',
            alignItems: 'center',
            width: '100%',
        },

        ...theme.fn.hover({
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        }),
    },

    headerLink: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        textDecoration: "none",
        color: theme.colorScheme === 'dark' ? theme.white : theme.black,
        fontWeight: 500,
        fontSize: theme.fontSizes.md,

        [theme.fn.smallerThan('sm')]: {
            height: 42,
            display: 'flex',
            alignItems: 'center',
            width: '100%',
        },

        ...theme.fn.hover({
            backgroundColor: theme.colors.pink[5],
        }),
    },

    linkActive: {
        '&, &:hover': {
            backgroundColor: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).background,
            color: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).color,
        },
    },

    subLink: {
        width: '100%',
        padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
        borderRadius: theme.radius.md,

        ...theme.fn.hover({
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
        }),

        '&:active': theme.activeStyles,
    },

    dropdownFooter: {
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
        margin: -theme.spacing.md,
        marginTop: theme.spacing.sm,
        padding: `${theme.spacing.md}px ${theme.spacing.md * 2}px`,
        paddingBottom: theme.spacing.xl,
        borderTop: `1px solid ${
            theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1]
        }`,
    },

    hiddenMobile: {
        [theme.fn.smallerThan('sm')]: {
            display: 'none',
        },
    },

    hiddenDesktop: {
        [theme.fn.largerThan('sm')]: {
            display: 'none',
        },
    },

    burger: {
        [theme.fn.largerThan('md')]: {
            display: 'none',
        },
    },

    title: {
        cursor: "pointer",
        [theme.fn.smallerThan('md')]: {
            fontSize: theme.fontSizes.xl,
        }
    }
}));

const links = [
    { link: '/create-dao', label: 'Create DataDAO', icon: IconHammer },
    { link: '/explore-daos', label: "Explore DAOs", icon: IconMapSearch },
    { link: '/Profile', label: 'Profile', icon: IconArtboard },
    { link: '/discussions', label: 'SpatialDAO Chat', icon: IconMessageDots },
    

]


export function HeaderSimple() {
    const [drawerOpened, {toggle: toggleDrawer, close: closeDrawer}] = useDisclosure(false);
    const {classes, cx} = useStyles();
    const [opened, {toggle, close}] = useDisclosure(false)
    const [active, setActive] = useState();
    const router = useRouter()

    const items = links.map((link) => (
        <Link href={link.link} passHref={true} key={link.label} className={classes.link}>
            {link.label}
        </Link>
    ));

    const desktopItems = links.map((link) => (
        <Link href={link.link} passHref key={link.label} className={cx(classes.headerLink, { [classes.linkActive]: active === link.link })}>
            {link.label}
        </Link>
    ));

    return (
        <Header height={120} p="md">
            <Group position="apart" p={"md"} sx={{height: '100%'}}>
                <Group>
                    <Center sx={{marginTop: -12}}>
                        <Image src="/logo.webp" width={70} height={70} mr={"sm"} alt="logo" radius={"xl"} style={{cursor: "pointer"}}
                               onClick={() => router.push('/')}/>
                        <Title onClick={() => router.push("/")} className={classes.title}>
                            spatial.DAO
                        </Title>
                    </Center>
                </Group>
                <Group className={classes.hiddenMobile} position="center" mb={15}>
                    {desktopItems}
                </Group>
                <Group className={classes.hiddenMobile} sx={{marginTop: -12}}>
                    <ConnectButton
                        accountStatus={{
                            smallScreen: 'avatar',
                            largeScreen: 'full',
                        }}
                        showBalance={false}
                    />
                </Group>
                <Burger opened={opened} onClick={toggle} className={classes.burger} size="sm"/>
                <Transition transition="pop-top-right" duration={200} mounted={opened}>
                    {(styles) => (
                        <Paper className={classes.dropdown} withBorder style={styles}>
                            <Stack pl={"2%"} align={"flex-start"} justify={"flex-start"}>
                                {items}
                                <div style={{padding: 10}}>
                                    <ConnectButton showBalance={false}/>
                                </div>
                            </Stack>
                        </Paper>
                    )}
                </Transition>
            </Group>
        </Header>
    );
}