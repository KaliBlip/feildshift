import type { ReactNode } from 'react';
import { sileo } from 'sileo-native';
import type { SileoOptions, SileoState, SileoVariant } from 'sileo-native';

export type ToastInput = string | SileoOptions;

function toOptions(input: ToastInput, description?: ReactNode): SileoOptions {
  if (typeof input === 'string') {
    return {
      title: input,
      ...(description !== undefined ? { description } : {}),
    };
  }
  if (description !== undefined && !input.description) {
    return { ...input, description };
  }
  return input;
}

export const toast = {
  success: (input: ToastInput, description?: ReactNode) =>
    sileo.success(toOptions(input, description)),
  error: (input: ToastInput, description?: ReactNode) =>
    sileo.error(toOptions(input, description)),
  info: (input: ToastInput, description?: ReactNode) =>
    sileo.info(toOptions(input, description)),
  warning: (input: ToastInput, description?: ReactNode) =>
    sileo.warning(toOptions(input, description)),
  action: (input: ToastInput, description?: ReactNode) =>
    sileo.action(toOptions(input, description)),
  show: (input: ToastInput, description?: ReactNode) =>
    sileo.show(toOptions(input, description)),
  promise: sileo.promise,
  dismiss: (id?: string) => (id ? sileo.dismiss(id) : sileo.clear()),
  clear: sileo.clear,
  raw: sileo,
};

export type { SileoOptions, SileoState, SileoVariant };
