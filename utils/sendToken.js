export const sendToken = (res, user, message, statusCode = 200) => {
  const token = user.getJWTToken();

  const options = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    sameSite: "none",
    httpOnly: true,
    secure: true,
  };

  res.cookie("token", token, options).json({
    success: true,
    message,
    user,
  });

  res.sendStatus(statusCode);
};
