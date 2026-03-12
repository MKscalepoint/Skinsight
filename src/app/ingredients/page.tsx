'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IngredientsDeepLink() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to home with a flag to open ingredient decoder
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('skinsight_open_tool', 'ingredients');
      router.replace('/');
    }
  }, [router]);
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#64748b' }}>
      Loading Skinsight…
    </div>
  );
}
