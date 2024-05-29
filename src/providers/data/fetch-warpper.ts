import {GraphQLFormattedError} from "graphql";

type Error = {
    message: string;
    statusCode: string;
}

/**
 * Custom fetch function to add the Authorization header
 * @param url 
 * @param options 
 * @returns 
 */

const cutomFetch = async (url: string, options: RequestInit) => {
    const accessToken = localStorage.getItem("accessToken");
    const headers =  options.headers as Record<string, string>;
    return await fetch(url, {
        ...options,
        headers: {
            ...headers,
            Authorization: headers?.Authorization || `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Apollo-Require-Preflight": "true", // Avoid CORS preflight
        }
    })
}

/**
 * Get the error message and status code from the response body
 * @param body 
 * @returns 
 */
const getGraphQLErrors = (body: Record<"errors", GraphQLFormattedError[] | undefined>):
Error | null => {
    if(!body) {
        return {
            message: 'Unknown error',
            statusCode: "INTERNAL_SERVER_ERROR"
        }
    }

    if("errors" in body) {
        const errors = body?.errors;

        // Join the errors into a single string
        const messages = errors?.map((error) => error?.message)?.join("");
        const code = errors?.[0]?.extensions?.code;

        return {
            message: messages || JSON.stringify(errors),
            statusCode: code || 500
        } 
    }

    return null;
}

/**
 * Wrapper around fetch to handle errors
 * @param url 
 * @param options 
 * @returns
 */
export const fetchWrapper = async (url: string, options: RequestInit) => {
    const response = await cutomFetch(url, options);
    // Clone the response for further processing
    const responseClone = response.clone();

    const body = await responseClone.json();
    const error = getGraphQLErrors(body);

    if(error) {
        throw error;
    }

    return response;

}