// CRA runs this file before every test.
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// React Router v7 needs these, but CRA's test environment (jsdom) lacks them.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
