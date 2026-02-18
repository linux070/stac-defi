import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';

// Custom Avatar component for project-wide consistency in RainbowKit
const CustomAvatar = ({ address, ensImage, size }) => {
    return ensImage ? (
        <img
            src={ensImage}
            width={size}
            height={size}
            style={{ borderRadius: 999 }}
            alt="Avatar"
        />
    ) : (
        <Jazzicon diameter={size} seed={jsNumberForAddress(address)} />
    );
};

export default CustomAvatar;
