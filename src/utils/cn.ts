type ClassValue = string | number | boolean | undefined | null;
type ClassArray = ClassValue[];
type ClassDictionary = Record<string, any>;
type ClassProp = ClassValue | ClassArray | ClassDictionary;

export function cn(...inputs: ClassProp[]): string {
  const classes = inputs.filter(Boolean);
  return classes.join(' ');
}
