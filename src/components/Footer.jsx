import { useOptions } from '../utils/optionsContext';

const Footer = () => {
  // Removed buymeacoffee button per request; keep component for compatibility.
  const { options } = useOptions();
  return null;
};

export default Footer;
