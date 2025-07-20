export const ErrorTypes = {
  LIMIT_UNEXPECTED_FILE: {
    errorCode: "LIMIT_UNEXPECTED_FILE",
    message: 'Vous ne pouvez pas uploader plus de 6 fichiers.',
    errorStatus: 400,
  },
  INTERNAL_SERVER_ERROR: {
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
    errorStatus: 500,
  },
};

export default (res, error) => {
  console.log("Throwing custom error");
  res.status(400).json({ message: error });
};
