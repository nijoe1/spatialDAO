import { useState } from 'react';
import {createStyles, Navbar, Text} from '@mantine/core';
import {
    IconArtboard,
    IconHammer, IconMapSearch,
    IconMessageDots
} from '@tabler/icons';

const useStyles = createStyles((theme, _params, getRef) => {
    const icon = getRef('icon');
    return {
        navbar: {
            backgroundColor: "#40107a",
            // backgroundColor: theme.fn.variant({ variant: 'filled', color: theme.colors.indigo[8] })
            //     .background,
            [theme.fn.smallerThan('md')]: {
                display: 'none',
            }
        },

        version: {
            backgroundColor: theme.fn.lighten(
                theme.fn.variant({ variant: 'filled', color: theme.colors.indigo[8] }).background!,
                0.1
            ),
            color: theme.colors.indigo[8],
            fontWeight: 700,
        },

        header: {
            paddingBottom: theme.spacing.md,
            marginBottom: theme.spacing.md * 1.5,
            borderBottom: `1px solid ${theme.fn.lighten(
                theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background!,
                0.1
            )}`,
        },

        footer: {
            paddingTop: theme.spacing.md,
            marginTop: theme.spacing.md,
            borderTop: `1px solid ${theme.fn.lighten(
                theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background!,
                0.1
            )}`,
        },

        link: {
            ...theme.fn.focusStyles(),
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            color: theme.white,
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            borderRadius: theme.radius.sm,
            fontWeight: 500,

            '&:hover': {
                backgroundColor: theme.fn.lighten(
                    theme.fn.variant({ variant: 'filled', color: theme.colors.gray[4] }).background!,
                    0.1
                ),
            },
        },

        linkIcon: {
            ref: icon,
            color: theme.white,
            opacity: 0.75,
            marginRight: theme.spacing.sm,
        },

        linkActive: {
            '&, &:hover': {
                backgroundColor: theme.fn.lighten(
                    theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background!,
                    0.15
                ),
                [`& .${icon}`]: {
                    opacity: 0.9,
                },
            },
        },
    };
});


const data = [
    { link: '/create-dao', label: 'create dataDAO', icon: IconHammer },
    { link: '/explore-daos', label: "explore DAOs", icon: IconMapSearch },
    { link: '/Profile', label: 'profile', icon: IconArtboard },
    { link: '/discussions', label: 'spatialDAO Chat', icon: IconMessageDots },
    
];

export function NavbarSide() {
    const { classes, cx } = useStyles();
    const [active, setActive] = useState(null);

    const links = data.map((item, index) => (
        <Text
            key={index}
            component={"a"}
            className={cx(classes.link, { [classes.linkActive]: item.label === active })}
            href={item.link}
        >
            <item.icon className={classes.linkIcon} stroke={1.5} />
            <span style={{color: "#CED4DA"}}>{item.label}</span>
        </Text>
    ));

    return (
        <Navbar height={"100vh"} width={{ sm: 200 }} p="md" className={classes.navbar}>
            <Navbar.Section grow>
                {links}
            </Navbar.Section>
        </Navbar>
    );
}