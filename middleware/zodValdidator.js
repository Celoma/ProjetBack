
function zodValidator(schema, req, res, next) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            res.status(400).json({ error: error.errors });
        }
    };

}

export default zodValidator