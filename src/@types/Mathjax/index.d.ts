//TypeScript support (and general documentation/support for Mathjax) is REALLY shitty, spent almost a whole day trying to get Mathjax to work with TS
//for example, I found this answer, but it didn't help, I really tried to get one of the mentioned examples to work, but failed miserably...
//I couldn't even find one single tutorial explaining step by step the components this libary is made up of
//documentation on their website is also lacking, urgh...

//So, I just import Mathjax in the HTML source tag of each demo and use this to make mathjax available globally from any .ts-file:
declare const MathJax: any;