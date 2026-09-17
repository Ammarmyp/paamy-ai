import { clsx, type ClassValue } from "cn";
import { twMerge } from "cn";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
