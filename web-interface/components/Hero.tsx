import {createStyles, Title, Text, Button, Container, Center} from '@mantine/core';
import {Dots} from './Dots';
import Link from "next/link";

const useStyles = createStyles((theme) => ({
    wrapper: {
        position: 'relative',
        paddingTop: 120,
        paddingBottom: 80,
        width: "100%",

        '@media (max-width: 755px)': {
            paddingTop: 80,
            paddingBottom: 60,
        },
    },

    inner: {
        position: 'relative',
        zIndex: 1,
        width: "100%"
    },

    dots: {
        position: 'absolute',
        color: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],

        '@media (max-width: 755px)': {
            display: 'none',
        },
    },

    dotsLeft: {
        left: 0,
        top: 0,
    },

    title: {
        textAlign: 'center',
        fontWeight: 800,
        fontSize: 40,
        letterSpacing: -1,
        color: theme.colorScheme === 'dark' ? theme.white : theme.black,
        marginBottom: theme.spacing.xs,
        fontFamily: `Greycliff CF, ${theme.fontFamily}`,

        '@media (max-width: 520px)': {
            fontSize: 28,
            textAlign: 'left',
        },
    },

    highlight: {
        color: theme.colors.violet[5],
    },

    description: {
        textAlign: 'center',

        '@media (max-width: 520px)': {
            textAlign: 'left',
            fontSize: theme.fontSizes.md,
        },
    },

    controls: {
        marginTop: theme.spacing.lg,
        display: 'flex',
        justifyContent: 'center',

        '@media (max-width: 520px)': {
            flexDirection: 'column',
        },
    },

    control: {
        '&:not(:first-of-type)': {
            marginLeft: theme.spacing.md,
        },

        '@media (max-width: 520px)': {
            height: 42,
            fontSize: theme.fontSizes.md,

            '&:not(:first-of-type)': {
                marginTop: theme.spacing.md,
                marginLeft: 0,
            },
        },
    },
}));

export function Hero() {
    const {classes} = useStyles();

    return (
        <Center>
        <Container className={classes.wrapper} size={1400}>
            <Dots className={classes.dots} style={{left: 0, top: 0}}/>
            <Dots className={classes.dots} style={{left: 60, top: 0}}/>
            <Dots className={classes.dots} style={{right: 60, top: 0}}/>
            <Dots className={classes.dots} style={{right: 0, top: 0}}/>

            <div className={classes.inner}>
                <Title className={classes.title}>
                    Create{' '}
                    <Text component="span" color={"violet.5"} inherit>
                        & Monetize 
                    </Text>{' '}
                    your dataDAO
                </Title>

                <Container p={0} size={600}>
                    <Text size="lg" color="dimmed" className={classes.description}>
                    SpatialDAO is a DataDAO that allows organizations to create deal bounties for specific pieces of data. Deal clients, on the other hand, are hunting bounties and making storage deals for DAO-proposed data and getting rewarded for that!
                    </Text>
                </Container>

                <div className={classes.controls}>
                    <Button target={"_blank"}  href={"https://github.com/nijoe1/spatialDAO"} component={"a"}
                            className={classes.control} size="lg" variant="default">
                        Source Code
                    </Button>
                    <Button href={"/create-dao"} component={"a"} className={classes.control}
                            size="lg" color={"violet.5"}>
                        Create your DAO
                    </Button>
                </div>
            </div>
        </Container>
        </Center>
    );
}