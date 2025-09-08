import { useState } from 'react';

const AIIcon = ({ size = 16, title = 'AI' }) => {
  const [src, setSrc] = useState('/ai-icon.png');
  const s = Math.round(size);
  return (
    <img
      src={src}
      onError={() => setSrc('/icon.svg')}
      alt={title}
      width={s}
      height={s}
      style={{ display: 'inline-block', borderRadius: 4 }}
    />
  );
};

export default AIIcon;
