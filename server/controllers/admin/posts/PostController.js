const Post = require("../../../models/Post");
const User = require("../../../models/User");

const adminLayout = "./layouts/admin.ejs";

module.exports = {
    create: (request, response) => {
        return response.render("admin/add-post", { layout: adminLayout });
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

            // let postData = allUserPosts.filter((post) => {
            //     return post._id == request.params.id
            // })[0];

            const postData = allUserPosts.id(request.params.id);

            return response.render("admin/edit-post", { postData, layout: adminLayout });

        } catch (error) {
            return response.sendStatus(500);
        }

    },

    update: async (request, response) => {
        try {

            await User.updateOne({ "posts._id": request.params.id },
                {
                    $set: {
                        'posts.$[post].title': request.body.title,
                        'posts.$[post].body': request.body.body,
                        'posts.$[post].updatedAt': new Date()
                    }
                },
                {
                    arrayFilters: [
                        { "post._id": request.params.id }
                    ]
                }
            );

            return response.sendStatus(200);

        } catch (error) {
            return response.sendStatus(500);
        }
    },
    delete: async (request, response) => {
        try {

            return response.sendStatus(200);

        } catch (error) {
            return response.sendStatus(500);
        }
    },
}