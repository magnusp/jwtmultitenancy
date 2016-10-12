let createHistory = window.History.createHistory;
let {Router, Route, IndexRoute, Link, useRouterHistory} = window.ReactRouter;

const browserHistory = useRouterHistory(createHistory)({
    basename: '/app'
});


class App extends React.Component {
    render() {
        return (<div>
            <div>
                <p>Enter-pricy Application</p>
                <p>Dont forget to have the console open!</p>
                <p>Available users</p>
                <ul>
                    <li>user1</li>
                    <li>user2</li>
                </ul>
            </div>
            <hr />
            {this.props.children}
        </div>);
    }
}

class Home extends React.Component {
    constructor() {
        super();
        this.state = {
            userProfile: {},
            switchToUsername: ""
        }
    }

    fetchProfile() {
        this.setState({
            switchToUsername: ""
        });
        fetch('/api/profile', {
            credentials: "same-origin",
            headers: {
                "Authentication": window.sessionStorage.getItem("jwt")
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response.json();
            })
            .then(data => {
                this.setState({
                    userProfile: data
                })
            })
            .catch(() => {
                console.log('(Home) That failed. Clearing JWT and redirecting to login');
                this.clearJWT();
                this.context.history.pushState(null, '/login');
            });
    }

    componentWillMount() {
        this.fetchProfile();
    }

    onChangeSwitchToUsername(e) {
        this.setState({
            switchToUsername: e.currentTarget.value
        });
    }

    handleClick() {
        window.open(`/app/switch/${this.state.switchToUsername}?jwt=${window.sessionStorage.getItem("jwt")}`);
    }

    clearJWT() {
        window.sessionStorage.removeItem("jwt");
        this.context.history.pushState(null, '');
    }

    render() {
        return <div>
            <p>Profile which is carried in the JWT (currently "logged in" user)</p>
            <ul>
                <li>id: {this.state.userProfile.id}</li>
                <li>username: {this.state.userProfile.username}</li>
            </ul>
            <hr />
            <form>
                <input placeholder="Username" type="text" value={this.state.switchToUsername}
                       onChange={this.onChangeSwitchToUsername.bind(this)}/>
            </form>
            <button onClick={this.handleClick.bind(this)}>Switch to user</button>
            <br />
            <button onClick={this.fetchProfile.bind(this)}>Refetch current profile</button>
            <br />
            <button onClick={this.clearJWT.bind(this)}>Logout by clearing JWT</button>
            <br />
            <a href="/app/logout">Logout everywhere by clearing cookie</a>
        </div>
    }
}
Home.contextTypes = {
    history: React.PropTypes.object
};

class Login extends React.Component {
    constructor() {
        super();
        this.state = {
            fetching: false,
            username: ""
        };
    }

    setFetching(value) {
        this.setState({
            fetching: value
        })
    }

    handleClick() {
        this.setFetching(true);
        fetch('/api/login/' + this.state.username, {
            credentials: "same-origin"
        })
            .then(response => {
                this.setFetching(false);
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response.json();
            })
            .then(data => {
                window.sessionStorage.setItem("jwt", data.jwt);
                this.context.history.pushState(null, '/home');
            })
            .catch(() => {
                console.log('failure Login');
                this.setState({
                    username: ""
                })
            });

    }

    onChangeUsername(e) {
        this.setState({
            username: e.currentTarget.value
        });
    }

    render() {
        return (<div>
            <form>
                <input placeholder="Username" type="text" disabled={this.state.fetching} value={this.state.username}
                       onChange={this.onChangeUsername.bind(this)}/>
            </form>
            <button disabled={this.state.fetching} onClick={this.handleClick.bind(this)}>Login</button>
            <br />
            <Link to="/home">Leads to /home which shouldn't work in this state (fingers crossed)</Link>
        </div>);
    }
}
Login.contextTypes = {
    history: React.PropTypes.object
};

function requireAuth(nextState, replaceState) {
    let isAuth = false;
    if (window.sessionStorage.getItem("jwt")) {
        isAuth = true;
    }
    console.log(Date.now(), "Auth is", isAuth);
    if (!isAuth && nextState.location.pathname != '/login') {
        replaceState({nextPathname: nextState.location.pathname}, '/login')
    }
}

ReactDOM.render(
    <Router history={browserHistory}>
        <Route path="/" component={App} onEnter={requireAuth}>
            <IndexRoute component={Home} onEnter={requireAuth}/>
            <Route path="home" component={Home} onEnter={requireAuth}/>
            <Route path="login" component={Login}/>
        </Route>
    </Router>,
    document.getElementById('container')
);
