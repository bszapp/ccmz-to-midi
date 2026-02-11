import { useState, useRef, useEffect } from 'react';

function ShuqianItem() {
    const [status, setStatus] = useState<'default' | 'hover' | 'active'>('default');
    const anchorRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (anchorRef.current) {
            anchorRef.current.href = `javascript:(async()=>{const e="${location.href.replace(/\/[^\/]*$/, '/')}";try{const t=document.querySelector("iframe");if(!t)throw 1;const n=new URL(t.src).searchParams.get("url");if(!n)throw 1;const o=await fetch(n);let a="";const s=o.headers.get("content-disposition");if(s){const e=s.match(/filename*=UTF-8''([^;]+)/i)||s.match(/filename="?([^";]+)"?/i);e&&(a=decodeURIComponent(e[1]))}if(!a){const e=new URL(n).pathname.split("/").pop();e&&(a=decodeURIComponent(e))}a||(a="download.bin");const c=parseInt(o.headers.get("content-length"),10)||0,i=o.body.getReader(),d=window.open(e);window.addEventListener("message",async e=>{if("READY"===e.data)for(;;){const{done:e,value:t}=await i.read();if(e){d.postMessage({action:"DONE",filename:a},"*");break}d.postMessage({action:"CHUNK",chunk:t,total:c},"*",[t.buffer])}})}catch(t){window.open(e)}})();`;
        }
    });

    const getBgColor = () => {
        if (status === 'active') return '#ddd';
        if (status === 'hover') return '#eee';
        return '#fff';
    };

    return (
        <a
            ref={anchorRef}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                color: '#444',
                textDecoration: 'none',
                padding: '0 12px',
                margin: '4px',
                height: '28px',
                borderRadius: '16px',
                fontSize: '14px',
                border: '1px solid #8884',
                width: 'fit-content',
                userSelect: 'none',
                backgroundColor: getBgColor(),
                transition: 'background-color 0.2s'
            }}
            onClick={e => e.preventDefault()}
            onMouseEnter={() => setStatus('hover')}
            onMouseLeave={() => setStatus('default')}
            onMouseDown={() => setStatus('active')}
            onMouseUp={() => setStatus('hover')}
            onTouchStart={() => setStatus('active')}
            onTouchEnd={() => setStatus('default')}
        >
            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#5f6368">
                <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-7-.5-14.5T799-507q-5 29-27 48t-52 19h-80q-33 0-56.5-23.5T560-520v-40H400v-80q0-33 23.5-56.5T480-720h40q0-23 12.5-40.5T563-789q-20-5-40.5-8t-42.5-3q-134 0-227 93t-93 227h200q66 0 113 47t47 113v40H400v110q20 5 39.5 7.5T480-160Z" />
            </svg>
            ccmz解析工具
        </a>
    );
}

export default ShuqianItem;