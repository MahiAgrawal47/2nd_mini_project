const express = require("express");
const app = express();
const path = require("path");
const userDetail = require("./models/userSchema");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.use(cookieParser());

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/register", async (req, res) => {
    let { email, password, username } = req.body;
    let user = await userDetail.findOne({ email: email });

    if (user) return res.status(500).send("Already registered");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let newUser   = await userDetail.create({
                username,
                email,
                password: hash,
            });

            let token = jwt.sign({ email: email, userid: newUser  ._id }, "shhhhhh");
            res.cookie("token", token);
            res.redirect("/login");
        });
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    let { email, password } = req.body;
    let user = await userDetail.findOne({ email });
    if (!user) {
        return res.status(500).json({ message: "Something went wrong" });
    }
    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email, userid: user._id }, "shhhhhh");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        } else {
            res.redirect("/login");
        }
    });
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") {
        return res.redirect("/login");
    }
    try {
        let data = jwt.verify(req.cookies.token, "shhhhhh");
        req.user = data; // This should have email and userid
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        res.redirect("/login");
    }
}

app.get("/profile", isLoggedIn, async (req, res) => {
    try {
        let user = await userDetail.findOne({ email: req.user.email }).populate("posts");
        if (!user) return res.status(404).send("User  not found");
        res.render("profile", { user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

app.post("/post", isLoggedIn, async (req, res) => {
    try {
        let user = await userDetail.findOne({ email: req.user.email });
        let { title, content, location } = req.body;

        let post = await postModel.create({
            user: user._id,
            title: title,
            content: content,
            location: location,
        });

        user.posts.push(post._id);
        await user.save();

        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");
    if (post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }
    await post.save();
    res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");
    res.render("edit", { post });
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
    try {
        const { title, content, location } = req.body; // Destructure title, content, and location from the request body

        // Update the post with the new title, content, and location
        await postModel.findOneAndUpdate(
            { _id: req.params.id },
            { title: title, content: content, location: location },
            { new: true } // Return the updated document
        );

        // Redirect to the profile page after updating
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

// New route for deleting a post
app.get("/delete/:id", isLoggedIn, async (req, res) => {
    try {
        const postId = req.params.id;
        const user = await userDetail.findOne({ email: req.user.email });

        // Remove the post from the user's posts array
        user.posts.pull(postId);
        await user.save();

        // Delete the post from the database
        await postModel.findByIdAndDelete(postId);

        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

app.get("/", async (req, res) => {
    try {
        const posts = await postModel.find().populate("user");
        res.render("index", { posts });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

app.get("/readblog", async (req, res) => {
    const posts = await postModel.find().populate("user");
    res.render("readblog", { posts });
});

app.listen(3006, () => {
    console.log("started on 3006 port");
});