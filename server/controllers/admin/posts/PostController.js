const Post = require("../../../models/Post");
const User = require("../../../models/User");

const adminLayout = "./layouts/admin.ejs";

module.exports = {
    create: (request, response) => {
        response.render("admin/add-post", { layout: adminLayout });
    },

    store: async (request, response) => {
        try {
            let user = await User.findOne({ _id: request.userId });

            user.posts.push({
                title: request.body.title,
                body: request.body.body,
            });

            await user.save();
            return response.sendStatus(200);

        } catch (error) {
            return response.sendStatus(500);
        }
    },

    edit: async (request, response) => {

        try {

            let allUserPosts = (await User.findById({ _id: request.userId })).posts;

            let postData = allUserPosts.filter((post) => {
                return post._id == request.params.id
            })[0];

            response.render("admin/edit-post", { postData, layout: adminLayout });

        } catch (error) {
            return response.sendStatus(500);
        }

    },

    update: async (request, response) => {
        try {

            let allUserPosts = (await User.findById({ _id: request.userId })).posts;

            let postData = allUserPosts.filter((post) => {
                return post._id == request.params.id
            })[0];

            await postData.updateOne({
                title: request.body.title,
                body: request.body.body
            });

            return response.sendStatus(200);

        } catch (error) {
            return response.sendStatus(500);
        }
    },
}