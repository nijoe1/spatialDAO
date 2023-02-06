import { createStyles, Text, SimpleGrid, Container } from '@mantine/core';
import {
    IconSettings,
    TablerIcon,
    IconAnchor,
    IconWallet,
    IconHeadphones,
    IconMessages
} from '@tabler/icons';

const useStyles = createStyles((theme) => ({
    feature: {
        position: 'relative',
        paddingTop: theme.spacing.xl,
        paddingLeft: theme.spacing.xl,
        marginTop: -110
    },

    overlay: {
        position: 'absolute',
        height: 105,
        width: 308,
        top: 1,
        left: -4,
        backgroundColor: theme.colors.violet[5],
        zIndex: 1,
    },

    content: {
        position: 'relative',
        zIndex: 2,
        left: -23
    },

    icon: {
        color: theme.colors.violet[7]
    },

    title: {
        color: theme.colorScheme === 'dark' ? theme.white : theme.black,
    },
}));

interface FeatureProps extends React.ComponentPropsWithoutRef<'div'> {
    icon: TablerIcon;
    title: string;
    description: string;
}

function Feature({ icon: Icon, title, description, className, ...others }: FeatureProps) {
    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.feature, className)} {...others}>
            <div className={classes.overlay} />

            <div className={classes.content}>
                <Icon color={"violet"} size={38} className={classes.icon} stroke={1.5} />
                <Text weight={700} size="lg" mb="xs" mt={5} className={classes.title}>
                    {title}
                </Text>
                <Text color="dimmed" size="sm">
                    {description}
                </Text>
            </div>
        </div>
    );
}

const mockdata = [
    {
        icon: IconSettings,
        title: 'Create your dataDAO',
        description:
            'Host your community and persist your DAO files on the filecoin network.',
    },
    {
        icon: IconMessages,
        title: 'Make file proposals',
        description:
            'So the community voters can decide about the files to get stored.',
    },
    {
        icon: IconAnchor,
        title: 'Create file bounties',
        description:
            'Incentivize deal makers to store DAO files by rewarding them.',
    },
];

export function Features() {
    const items = mockdata.map((item) => <Feature {...item} key={item.title} />);

    return (
        <Container mb={30} size="lg">
            <SimpleGrid cols={3} breakpoints={[{ maxWidth: 'sm', cols: 1 }]} spacing={50}>
                {items}
            </SimpleGrid>
        </Container>
    );
}