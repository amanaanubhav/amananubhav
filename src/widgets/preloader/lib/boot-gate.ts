import { CLIMB_SRC } from '../config/climb.generated';
import { BOOT_GATE_TEMPLATE } from './gate-template';

/** The pre-paint boot gate (design §4.1) with the current climb script; PrePaintScript emits it after the motion
 * gate. */
export const BOOT_GATE_SCRIPT = BOOT_GATE_TEMPLATE.replace('__CLIMB_SRC__', CLIMB_SRC);
