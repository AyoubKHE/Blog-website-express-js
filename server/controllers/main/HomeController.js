// const Post = require("../../models/Post");
const User = require("../../models/User");

const withTransaction = require("../../config/db").withTransaction;

module.exports = {
    index: async (request, response) => {

        async function loadPostsData(page, perPage, session) {

            return await User.aggregate([
                {
                    $unwind: "$posts"
                },
                {
                    $replaceRoot:
                    {
                        newRoot: "$posts"
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                }
            ])
                .session(session)
                .skip(perPage * page - perPage)
                .limit(perPage)
                .exec();
        }

        async function buildOlderPostsLink(page, perPage, session) {

            const postsCount = (await User.aggregate([
                { $unwind: "$posts" },
                { $count: "postsCount" }
            ]).session(session))[0].postsCount;

            const hasNextPage = page + 1 <= Math.ceil(postsCount / perPage);
            const nextPage = hasNextPage ? page + 1 : null;

            return nextPage;
        }

        const perPage = 3;
        const page = parseInt(request.query.page) || 1;

        try {

            let postsData, olderPostsLink;

            await withTransaction(async (session) => {

                postsData = await loadPostsData(page, perPage, session);

                olderPostsLink = await buildOlderPostsLink(page, perPage, session);
            });

            response.render("index", { postsData, olderPostsLink });
        } catch (error) {
            console.log(error);
            response.sendStatus(500);
        }
    },

    getSinglePost: async (request, response) => {
        // let postID = request.params.id;

        // try {

        //     let postData = await Post.findById({ _id: postID });

        //     response.render("post", { postData });

        // } catch (error) {
        //     console.log(error);
        //     response.sendStatus(500);
        // }

    },

    search: async (request, response) => {

        // let searchTerm = request.body.searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

        // try {

        //     let postsData = await Post.find({
        //         $or: [
        //             { title: { $regex: new RegExp(searchTerm, 'i') } },
        //             { body: { $regex: new RegExp(searchTerm, 'i') } }
        //         ]
        //     });

        //     response.render("search", { postsData });

        // } catch (error) {
        //     console.log(error);
        //     response.sendStatus(500);
        // }

    }
};