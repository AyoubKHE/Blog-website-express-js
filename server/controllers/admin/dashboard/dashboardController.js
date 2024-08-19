const User = require("../../../models/User");
const adminLayout = "./layouts/admin.ejs";

module.exports = {
    index: async (request, response) => {

        async function loadUserPosts(userID) {
            try {
                return (await User.findOne({ _id: userID }).lean()).posts;

            } catch (error) {
                return null;
            }

        }

        let userPosts = await loadUserPosts(request.userId);

        return response.render("admin/dashboard", { userPosts, layout: adminLayout });
    },
}