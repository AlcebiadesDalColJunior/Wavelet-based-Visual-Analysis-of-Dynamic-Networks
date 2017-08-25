# Wavelet-based Visual Analysis of Dynamic Networks

Alcebiades Dal Col, Paola Valdivia, Fabiano Petronetto, Fabio Dias, Claudio T. Silva, and L. Gustavo Nonato


Python implementation related to the paper, plus tools. Original paper presenting the approximation method: https://arxiv.org/abs/0912.3848 (Hammond et al)


### code:

- cmdWavelets.py: Command line tool to compute the wavelet coefficients, from an "edges" file and a "signal" file. Output is written by np.savetxt, nodes as rows, timeslices as columns.

- thiers2012.py: Script for the thiers2012 dataset, using all configuration options and tricks (use as base for more complex situations)

- util.py: Utility functions

### datasets:
- thiers2012, from http://www.sociopatterns.org/datasets/high-school-dynamic-contact-networks/
- simple : Synthetic test dataset for the command line tool


### File format:

- Edges: One time slice per line, edges separated by ";"  (n1,n2);(n2;n3);...;(na,nb)

- Signal: Identical to the edges file, but values instead of pairs.


### Acknowledgements:

Grants 2011/22749-8, 2013/14089-3, 2014/12815-1, 2015/03330-7, and 2016/04391-2 Sao Paulo Research Foundation (FAPESP). The views expressed are those of the authors and do not reflect the official policy or position of the São Paulo Research Foundation. Alcebiades acknowledges CAPES for the financial support to the present research work.
