//absolutely no idea if this declaration file is correct, don't know why I can't declare the module as color.scss (TS compiler then doesn't find declaration?!)
//goal with all of this is to make Sass variables available in TS
//started from those articles, however they seemed to leave out important details on how to call file and where to put it and what exactly put into it and how to setup tsconfig, urgh....
//https://mattferderer.com/use-sass-variables-in-typescript-and-javascript  https://sergiocarracedo.es/2020/07/17/sharing-variables-between-scss-and-typescript/
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