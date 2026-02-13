
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
    if (!window.Buffer) {
        window.Buffer = Buffer;
    }
    if (!window.global) {
        window.global = window;
    }
    if (!window.process) {
        window.process = { env: {} } as any;
    }
}
