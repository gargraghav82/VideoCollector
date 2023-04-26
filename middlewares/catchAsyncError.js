export const catchAsyncError = (passesFunction) => (req , res , next) => {
    Promise.resolve(passesFunction(req , res , next)).catch(next);
}