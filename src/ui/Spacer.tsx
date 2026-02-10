interface SpacerProps {
    width?: string;
    height?: string;
}

const Spacer = ({ width, height }: SpacerProps) => {
    return (
        <div
            style={{
                width: width || '0px',
                height: height || '0px',
            }}
        />
    );
};

export default Spacer;