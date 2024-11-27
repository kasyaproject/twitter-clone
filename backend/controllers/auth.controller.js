export const signup = async (req, res) => {
  res.json({
    message: "Welcome to the signup page",
  });
};

export const login = async (req, res) => {
  res.json({
    message: "Welcome to the Login page",
  });
};

export const logout = async (req, res) => {
  res.json({
    message: "Your are logging out",
  });
};
