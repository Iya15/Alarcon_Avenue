import { type Variants } from 'framer-motion';

const easeApple = [0.32, 0.72, 0, 1] as const;

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } },
    exit:    { opacity: 0, transition: { duration: 0.1,  ease: 'easeIn' } },
};

export const slideUp: Variants = {
    hidden:  { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2,  ease: easeApple } },
    exit:    { opacity: 0, y: 6, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const slideDown: Variants = {
    hidden:  { opacity: 0, y: -6 },
    visible: { opacity: 1, y: 0,  transition: { duration: 0.2,  ease: easeApple } },
    exit:    { opacity: 0, y: -6, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const scaleIn: Variants = {
    hidden:  { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1,    transition: { duration: 0.18, ease: easeApple } },
    exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.13, ease: 'easeIn' } },
};

export const drawerLeft: Variants = {
    hidden:  { x: '-100%' },
    visible: { x: 0, transition: { duration: 0.28, ease: easeApple } },
    exit:    { x: '-100%', transition: { duration: 0.22, ease: 'easeIn' } },
};

export const drawerRight: Variants = {
    hidden:  { x: '100%' },
    visible: { x: 0, transition: { duration: 0.28, ease: easeApple } },
    exit:    { x: '100%', transition: { duration: 0.22, ease: 'easeIn' } },
};

export const drawerBottom: Variants = {
    hidden:  { y: '100%' },
    visible: { y: 0, transition: { duration: 0.3, ease: easeApple } },
    exit:    { y: '100%', transition: { duration: 0.22, ease: 'easeIn' } },
};

export const pageTransition: Variants = {
    hidden:  { opacity: 0, y: 4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: easeApple } },
    exit:    { opacity: 0,       transition: { duration: 0.12 } },
};

export const toastItem: Variants = {
    hidden:  { opacity: 0, y: 16, scale: 0.96 },
    visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.22, ease: easeApple } },
    exit:    { opacity: 0, y: 8,  scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const backdrop: Variants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.18 } },
    exit:    { opacity: 0, transition: { duration: 0.15 } },
};
