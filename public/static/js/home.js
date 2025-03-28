let currentPage = 1; // Trang hiện tại
async function fetchPosts(currentPage) {
    const container = document.getElementById('posts-container');
    container.innerHTML = "";
    try {
        console.log(currentPage);
        const response = await fetch(`/api/posts?page=${currentPage}`); // Đảm bảo API URL chính xác


        if (!response.ok) {
            throw new Error(`Lỗi API: ${response.status}`);
        }

        const posts = await response.json();
        console.log("Dữ liệu bài viết:", posts); // Kiểm tra dữ liệu nhận được


        posts.posts.forEach(async (post) => {
            const postElement = document.createElement("div");
            postElement.className = "post";
            postElement.dataset.postid = post.postid; // Gán postid vào dataset
            let imagesHTML = "";
            let displayname = "Ẩn danh"; // Mặc định nếu không lấy được username
            if (post.images.length > 0) {
                post.images.forEach(image => {
                    console.log(image)
                    imagesHTML += `<img src="${image}" alt="Hình ảnh bài viết" style="width:auto; height:400px; border-radius:10px; margin-top:10px;">`;
                });
            }
            try {
                const userResponse = await fetch(`/api/posts/getUser/${post.userid}`);
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    displayname = userData.displayname || "Ẩn danh"; // Giả sử API trả về { username: "Tên người dùng" }
                }
            } catch (err) {
                console.error("Lỗi khi lấy tên người dùng:", err);
            }
            let upvoteCount = 0;
            try {
                const upvoteResponse = await fetch(`/api/posts/getUpvoteCount/${post.postid}`);
                if (upvoteResponse.ok) {
                    const upvoteData = await upvoteResponse.json();
                    upvoteCount = upvoteData.upvoteCount || 0; // Đúng key

                }
            } catch (err) {
                console.error("Lỗi khi lấy số upvote:", err);
            }
            postElement.classList.add("post-container");
            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p><strong>Người đăng:</strong> ${displayname}</p>
                <div class="post-images">
                ${imagesHTML}
                </div>
                <br>
                <button class="cmt-button" onclick="openPopup(${post.postid})">Xem chi tiết bài viết và bình luận</button>
                <br>
                <button class="upvote-btn" data-postid="${post.postid}">
                    👍 <span class="upvote-count">${upvoteCount}</span>
                </button>
               
            `;



            //${imagesHTML} cho len tren
            container.appendChild(postElement);
        });
        updatePagination(posts.totalPages || 1, posts.currentPage || currentPage);
    } catch (error) {
        console.error('Lỗi khi tải bài viết:', error);
    }
}
// Thêm sự kiện click cho nút upvote sau khi tải bài viết
document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("upvote-btn")) {
        let postid = event.target.dataset.postid;
        let upvoteCountSpan = event.target.querySelector(".upvote-count");

        try {
            const response = await fetch('/api/posts/toggleUpvote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postid })
            });

            const data = await response.json();

            if (response.status === 401) {
                alert(data.message); // Hiển thị "Bạn cần đăng nhập" nếu chưa đăng nhập
                return;
            }

            if (response.ok) {
                // Lấy số upvote mới sau khi upvote hoặc bỏ upvote
                const upvoteResponse = await fetch(`/api/posts/getUpvoteCount/${postid}`);
                if (upvoteResponse.ok) {
                    const upvoteData = await upvoteResponse.json();
                    upvoteCountSpan.textContent = upvoteData.upvoteCount; // Đúng key
                }
                
            } else {
                console.error("Lỗi khi toggle upvote");
            }
        } catch (error) {
            console.error("Lỗi khi gửi yêu cầu upvote:", error);
        }
    }
});



function updatePagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    // Nút "Trang trước"
    const prevButton = document.createElement("button");
    prevButton.innerText = "← Trang trước";
    prevButton.disabled = currentPage === 1;

    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--; // Giảm trang
            fetchPosts(currentPage);  // Gọi lại API
        }
    });

    // Hiển thị số trang
    const pageIndicator = document.createElement("span");
    pageIndicator.innerText = `Trang ${currentPage} / ${totalPages}`;
    pageIndicator.style.margin = "0 10px";

    // Nút "Trang sau"
    const nextButton = document.createElement("button");
    nextButton.innerText = "Trang sau →";
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++; // Tăng trang

            console.log(currentPage);
            console.log("aaaaa");
            fetchPosts(currentPage);  // Gọi lại API
        }
    });

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageIndicator);
    paginationContainer.appendChild(nextButton);
}

document.getElementById("deletePostBtn")?.addEventListener("click", async () => {
    if (confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
        const postid = "{{post.postid}}";

        const response = await fetch(`/posts/delete/${postid}`, { method: "DELETE" });
        const result = await response.json();

        if (result.success) {
            alert("Bài viết đã bị xóa!");
            window.location.href = "/"; // Điều hướng về trang chính
        } else {
            alert("Lỗi khi xóa bài viết!");
        }
    }
});


async function openPopup(postid) {
    const popup = document.getElementById("comment-popup");
    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = ""; // Xóa dữ liệu cũ trước khi tải mới
    const response = await fetch(`/api/posts/${postid}`);
    const post = await response.json();
    const userResponse = await fetch(`/api/posts/getUser/${post.userid}`);
    const userData = await userResponse.json();

    document.getElementById("modal-post-title").textContent = post.title;
    document.getElementById("modal-post-authorname").textContent = userData.displayname;
    document.getElementById("post-content").innerHTML = `<iframe src="${post.content}" width="100%" height="450px"></iframe>`;
    try {
        const response = await fetch(`/api/comments/${postid}`);
        if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);

        const comments = await response.json();
        comments.forEach((comment) => {
            const displayname = comment.displayname || "Ẩn danh"; // Lấy trực tiếp từ API

            const commentElement = document.createElement("p");
            commentElement.innerHTML = `<strong>${displayname}:</strong> ${comment.content}`;
            commentsList.appendChild(commentElement);
        });
    } catch (error) {
        console.error("Lỗi khi tải bình luận:", error);
    }

    // Hiển thị popup
    popup.classList.remove("hidden");
    document.getElementById("submit-comment").onclick = () => submitComment(postid);
}

function closePopup() {
    document.getElementById("comment-popup").classList.add("hidden");
}

async function submitComment(postid) {
    const commentInput = document.getElementById("comment-input");
    const content = commentInput.value.trim();
    if (!content) return alert("Vui lòng nhập bình luận!");

    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postid, content })
        });

        if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);
        alert("Đã gửi bình luận!");
        openPopup(postid); // Refresh lại danh sách bình luận
    } catch (error) {
        console.error("Lỗi khi gửi bình luận:", error);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const contentFrame = document.querySelector("iframe");
    const modal = document.getElementById("post-modal");
    const openModalBtn = document.getElementById("open-post-modal");
    const closeModalBtn = document.querySelector(".close1");
    const postForm = document.getElementById("post-form");
    const loadingOverlay = document.getElementById("loading-overlay");
    // Mở popup khi nhấn nút "Tạo bài viết"
    async function createGoogleDoc() {
        const loadingOverlay = document.getElementById("loading-overlay");
        const iframe = document.getElementById("google-docs-iframe");


        try {
            const response = await fetch("/api/posts/create-google-doc", { method: "POST" });
            const data = await response.json();

            if (data.success) {
                contentFrame.src = data.docUrl;
                contentFrame.dataset.docUrl = data.docUrl;

            } else {

                alert("Không thể tạo Google Docs.");
            }
        } catch (error) {

            console.error("Lỗi khi tạo Google Docs:", error);
        } finally {
            document.querySelector(".loading-overlay").style.zIndex = "-1000";
        }
    }

    openModalBtn.addEventListener("click", () => {
        modal.style.display = "block";
        document.querySelector(".loading-overlay").style.zIndex = "1000";
        createGoogleDoc(); // Gọi hàm khi mở modal
    });


    document.addEventListener("DOMContentLoaded", () => {
        const modal = document.getElementById("post-modal");
        const closeModalBtn = document.querySelector(".close1");
    
        closeModalBtn.addEventListener("click", () => {
            console.log("Đã bấm nút X");
            modal.style.display = "none";
        });
    
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                console.log("Bấm ra ngoài modal");
                modal.style.display = "none";
            }
        });
    });
    // Xử lý gửi bài viết
    postForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const loadingOverlay = document.getElementById("loading-overlay");
        const formData = new FormData();
        formData.append("title", document.getElementById("title").value);
        const docUrl = contentFrame?.dataset?.docUrl || "";
        formData.append("content", contentFrame.dataset.docUrl); // Lưu link Docs vào DB
        document.querySelector(".loading-overlay").style.zIndex = "1000";
        // Lấy file ảnh từ input
        const images = document.getElementById("images").files;
        for (let i = 0; i < images.length; i++) {
            formData.append("images", images[i]); // Đặt tên "files" để backend nhận đúng
        }

        try {
            const response = await fetch("/api/posts/create", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                alert("Bài viết đã được tạo!");
                modal.style.display = "none";
                location.reload(); // Tải lại danh sách bài viết
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Lỗi khi đăng bài:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            document.querySelector(".loading-overlay").style.zIndex = "-1000";
        }
    });
});


document.getElementById("openMyPosts").addEventListener("click", async () => {
    const popup = document.getElementById("myPostsPopup");
    const postList = document.getElementById("myPostsList");

    popup.style.display = "block";
    postList.innerHTML = "<p>Đang tải...</p>";

    try {
        const response = await fetch("/api/posts/myposts");
        const result = await response.json();

        if (result.success) {
            postList.innerHTML = "";
            if (result.myPosts.length === 0) {
                postList.innerHTML = "<p>Không có bài viết nào</p>";
            } else {
                result.myPosts.forEach(post => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                    <table class="post-table">
                        <tr>
                        <td class="post-title">${post.title}</td>
                        <td class="post-action"> <button class="deletePostBtn btn btn-danger" data-postid="${post.postid}">Xóa</button></td>
                       
                        </tr>
                    `;
                    postList.appendChild(li);
                });

                // Gắn sự kiện xóa bài viết
                document.querySelectorAll(".deletePostBtn").forEach(btn => {
                    btn.addEventListener("click", async function () {
                        const postid = this.dataset.postid;
                        if (confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
                            await deletePost(postid);
                        }
                    });
                });
            }
        } else {
            postList.innerHTML = "<p>Lỗi tải dữ liệu</p>";
        }
    } catch (error) {
        console.error(error);
        postList.innerHTML = "<p>Lỗi kết nối</p>";
    }
});

// Đóng pop-up
document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("myPostsPopup").style.display = "none";
    console.log("adycgyyadgauy")
});
document.querySelector(".close1").addEventListener("click", () => {
    document.getElementById("post-modal").style.display = "none";
    console.log("adycgyyadgauy")
});


// Hàm xóa bài viết
async function deletePost(postid) {
    try {
        const response = await fetch(`api/posts/delete/${postid}`, { method: "DELETE" });
        const result = await response.json();

        if (result.success) {
            alert("Bài viết đã bị xóa!");
            document.querySelector(`[data-postid="${postid}"]`).parentElement.remove();
        } else {
            alert("Lỗi khi xóa bài viết!");
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối");
    }
}



// Gọi API khi trang load 
document.addEventListener("DOMContentLoaded", () => {
    fetchPosts(1);
})

