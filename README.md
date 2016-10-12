# Toy project 

Dont forget to:

- Create an virtualenv
- pip install -r


    python jwtmultitenancy.py 

Visit http://127.0.0.1:5000/app


## What is it?

The principal (human behind the keyboard) authenticates and carries
authorization in a JWT (by signature). I also demonstrate how we can switch
to another user (but not principal) by also validating that we carry
some information about the principal in a cookie, which we assert also exists
in the JWT. In the real world we would sign the cookie and not expose it to
the user agent. We can terminate a session by clearing the session stored
JWT, or clear all sessions by removing the cookie.