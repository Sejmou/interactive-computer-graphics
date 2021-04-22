//absolutely no idea if this declaration file is correct, don't know why I can't declare the module as color.scss (TS compiler then doesn't find declaration?!)
declare module '*.scss' {
  export const primaryColor: string;
  export interface Colors {
    primaryColor: string;
    secondaryColor: string;
    successColor: string;
    errorColor: string;
    linkColor: string;
  }

  export const colors: Colors;

  export default colors;
}