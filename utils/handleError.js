function handleError(errorStatus, errorMsg) {
    return {
        status: errorStatus,
        message: errorMsg,
    }
}

module.exports = { handleError };
