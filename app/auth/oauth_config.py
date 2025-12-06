"""
OAuth2 Configuration for Google Login
"""
import os
from authlib.integrations.starlette_client import OAuth

# OAuth Configuration
oauth = OAuth()

# Google OAuth
oauth.register(
    name='google',
    client_id='596293768578-0383bmbvvr3brdbi7t504nijnrc9iv5f.apps.googleusercontent.com',
    client_secret='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',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)
