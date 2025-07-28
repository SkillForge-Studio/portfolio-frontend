export const selfGetURL = () => {
    let url =
        process?.env?.NEXT_PUBLIC_AUTH_URL ??
        'http://localhost:4000'

    url = url.startsWith('http') ? url : `https://${url}`
    url = url.endsWith('/') ? url : `${url}/`

    return url
}