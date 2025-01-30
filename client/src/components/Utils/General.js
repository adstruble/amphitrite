
export const range = (start, end) => {
    let a = Array.from(
        {length: end < start ? start - end : end - start},
        (value, index) => end < start ? start - index : start + index
    )

    return a.map(Number)
}

export function onKeyupWithDelay(fn, ms) {
    let timer = 0
    return function(...args) {
        clearTimeout(timer)
        timer = setTimeout(fn.bind(this, ...args), ms || 0)
    }
}

export const ConditionalWrapper = ({ condition, wrapper, children }) =>
    condition ? wrapper(children) : children;
