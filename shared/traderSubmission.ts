export type TraderAccountInput = { name: string; phone?: string; address?: string; notes?: string };

export async function persistTraderForm(input: {
  form: { reset: () => void };
  values: TraderAccountInput;
  onSave: (values: TraderAccountInput) => Promise<unknown>;
}) {
  await input.onSave(input.values);
  input.form.reset();
}
