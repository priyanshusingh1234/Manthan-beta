'use client';

import React, { useEffect, useState } from 'react';
import LevelUpModal from '@/components/LevelUpModal';

export default function GlobalLevelUpListener() {
  const [show, setShow] = useState(false);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const handleLevelUp = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.level) {
        setLevel(customEvent.detail.level);
        setShow(true);
      }
    };

    window.addEventListener('level_up', handleLevelUp);
    return () => window.removeEventListener('level_up', handleLevelUp);
  }, []);

  return (
    <LevelUpModal
      isOpen={show}
      newLevel={level}
      onClose={() => setShow(false)}
    />
  );
}
