// ----------------------- Misc -------------------------

export function indexToLowercaseLetter(i: number): string {
    return String.fromCharCode(i + 97);
}
/**
 *
 * @param noOfValues the desired length of the array
 * @param begin first desired value in array (inclusive)
 * @param end last desired value in array (inclusive)
 * @returns
 */

export function createArrayOfEquidistantAscendingNumbersInRange(noOfValues: number, begin: number, end: number): number[] {
    return [...Array(noOfValues).keys()].map(i => begin + (i / (noOfValues - 1)) * (end - begin));
}
/**
 * Emulates Python's built-in range() function (stolen from https://stackoverflow.com/a/8273091/13727176)
 * @param start the start of the range (if only parameter provided this the stop value (exclusive))
 * @param stop the end of the range (exclusive)
 * @param step the step size. If negative, the range starts at stop and ends at start (each value gets decremented by step)
 * @returns an array with the desired range of numbers
 */

export function range(start: number, stop?: number, step?: number) {
    if (stop == undefined) {
        stop = start;
        start = 0;
    }

    if (step == undefined)
        step = 1;

    //invalid parameter combinations
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    let result = [];
    for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
}
;
/**
* Returns the index of the last element in the array where predicate is true, and -1
* otherwise. Copied from https://stackoverflow.com/a/53187807/13727176.
* @param array The source array to search in
* @param predicate find calls predicate once for each element of the array, in descending
* order, until it finds one where predicate returns true. If such an element is found,
* findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
*/

export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let l = array.length;
    while (l--) {
        if (predicate(array[l], l, array))
            return l;
    }
    return -1;
}

/**
 * Finds max number in a numbers array
 * 
 * Wrote this because Math.max(...numbers) didn't work for whatever weird reason...
 * 
 * @param numbers 
 * @returns 
 */
export function findMaxNumber(numbers: number[]) {
    let currMax = Number.MIN_VALUE;
    numbers.forEach(num => {
        if (num > currMax) currMax = num;
    });
    return currMax;
}