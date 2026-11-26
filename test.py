import numpy as np
import pandas as pd
import streamlit as st

st.set_page_config(page_title="Simple Streamlit App", layout="centered")

st.title("My First Streamlit App")
st.write("A minimal starter layout with interactive inputs and a chart.")

# Sidebar controls
st.sidebar.header("Settings")
points = st.sidebar.slider("Number of data points", min_value=10, max_value=100, value=30)
show_table = st.sidebar.checkbox("Show raw data table", value=False)

# Main interactive section
name = st.text_input("Your name", placeholder="Enter your name")
if name:
    st.success(f"Welcome, {name}!")

# Sample data & visualization
data = pd.DataFrame({
    "Step": np.arange(1, points + 1),
    "Value": np.cumsum(np.random.randn(points)),
})

st.metric(label="Latest Value", value=f"{data['Value'].iloc[-1]:.2f}")
st.line_chart(data, x="Step", y="Value")

if show_table:
    st.dataframe(data, use_container_width=True)
